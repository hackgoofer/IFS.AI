'use strict';
import DID_API from './api.json' assert { type: 'json' };
if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

import { fetchWithRetries } from './fetchUtil';

export function initializeStreamingClient({
  avatarUrl,
  videoElementRef,
  setIceGatheringStatusLabel,
  setIceStatusLabel,
  setPeerStatusLabel,
  setSignalingStatusLabel,
  setStreamingStatusLabel,
}) {
  let peerConnection;
  let streamId;
  let sessionId;
  let sessionClientAnswer;
  let statsIntervalId;
  let videoIsPlaying;
  let lastBytesReceived;

  function onIceGatheringStateChange() {
    setIceGatheringStatusLabel(peerConnection.iceGatheringState);
  }

  function onIceCandidate(event) {
    console.log('onIceCandidate', event);
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
      fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/ice`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: sessionId,
        }),
      });
    }
  }

  function onIceConnectionStateChange() {
    setIceStatusLabel(peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
      stopAllStreams();
      closePC();
    }
  }

  function onConnectionStateChange() {
    // not supported in firefox
    setPeerStatusLabel(peerConnection.connectionState);
  }

  function onSignalingStateChange() {
    setSignalingStatusLabel(peerConnection.signalingState);
  }

  function onVideoStatusChange(videoIsPlaying, stream) {
    let status;
    if (videoIsPlaying) {
      status = 'streaming';
      const remoteStream = stream;
      setVideoElement(remoteStream);
    } else {
      status = 'empty';
      playIdleVideo();
    }
    setStreamingStatusLabel(status);
  }

  function onTrack(event) {
    /**
     * The following code is designed to provide information about wether currently there is data
     * that's being streamed - It does so by periodically looking for changes in total stream data size
     *
     * This information in our case is used in order to show idle video while no video is streaming.
     * To create this idle video use the POST https://api.d-id.com/talks (or clips) endpoint with a silent audio file or a text script with only ssml breaks
     * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
     * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
     */
    if (!event.track) return;
    statsIntervalId = setInterval(async () => {
      const stats = await peerConnection.getStats(event.track);
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;
          if (videoStatusChanged) {
            videoIsPlaying = report.bytesReceived > lastBytesReceived;
            onVideoStatusChange(videoIsPlaying, event.streams[0]);
          }
          lastBytesReceived = report.bytesReceived;
        }
      });
    }, 500);
  }

  async function createPeerConnection(offer, iceServers) {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers });
      peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
      peerConnection.addEventListener('icecandidate', onIceCandidate, true);
      peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
      peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
      peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
      peerConnection.addEventListener('track', onTrack, true);
    }
    await peerConnection.setRemoteDescription(offer);
    console.log('set remote sdp OK');
    const sessionClientAnswer = await peerConnection.createAnswer();
    console.log('create local sdp OK');
    await peerConnection.setLocalDescription(sessionClientAnswer);
    console.log('set local sdp OK');
    return sessionClientAnswer;
  }

  function setVideoElement(stream) {
    if (!stream) return;
    if (!videoElementRef) return;
    videoElementRef.current.srcObject = stream;
    videoElementRef.current.loop = false;
    // safari hotfix
    if (videoElementRef.current.paused) {
      videoElementRef.current
        .play()
        .then((_) => {})
        .catch((e) => {});
    }
  }

  function playIdleVideo() {
    console.log('playing idle video');
    if (!videoElementRef) return;
    videoElementRef.current.srcObject = undefined;
    videoElementRef.current.src = 'or_idle.mp4';
    videoElementRef.current.loop = true;
  }

  function stopAllStreams() {
    if (videoElementRef && videoElementRef.current.srcObject) {
      console.log('stopping video streams');
      videoElementRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoElementRef.current.srcObject = null;
    }
  }

  function closePC(pc = peerConnection) {
    if (!pc) return;
    console.log('stopping peer connection');
    pc.close();
    pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    pc.removeEventListener('icecandidate', onIceCandidate, true);
    pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
    pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
    pc.removeEventListener('track', onTrack, true);
    clearInterval(statsIntervalId);
    setIceGatheringStatusLabel('');
    setSignalingStatusLabel('');
    setIceStatusLabel('');
    setPeerStatusLabel('');
    console.log('stopped peer connection');
    if (pc === peerConnection) {
      peerConnection = null;
    }
  }

  return {
    connect: async () => {
      if (peerConnection && peerConnection.connectionState === 'connected') {
        return;
      }
      stopAllStreams();
      closePC();
      console.log("connecting to streaming service", avatarUrl);
      const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          source_url: avatarUrl,
        }),
      });
      const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
      streamId = newStreamId;
      sessionId = newSessionId;
      try {
        sessionClientAnswer = await createPeerConnection(offer, iceServers);
      } catch (e) {
        console.log('error during streaming setup', e);
        stopAllStreams();
        closePC();
        return;
      }
      const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: sessionClientAnswer,
          session_id: sessionId,
        }),
      });
    },
    start: async () => {
      // connectionState not supported in firefox
      if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
        const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${DID_API.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: {
              type: 'text',
              input: 'this is an arbitrary sentence we have supplied for the purpose of this demo',
            },
            config: {
              stitch: true,
            },
            session_id: sessionId,
          }),
        });
      }
    },
    destroy: async () => {
      await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      stopAllStreams();
      closePC();
    },
  };
}
