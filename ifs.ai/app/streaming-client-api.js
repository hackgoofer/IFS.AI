'use strict';
import DID_API from './api.json' assert { type: 'json' };

if (DID_API.key == '🤫') alert('Please put your api key inside ./api.json and restart..');

// const RTCPeerConnection = (
//   window.RTCPeerConnection ||
//   window.webkitRTCPeerConnection ||
//   window.mozRTCPeerConnection
// ).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

// const videoElement = document.getElementById('video-element');
// videoElement.setAttribute('playsinline', '');
// const peerStatusLabel = document.getElementById('peer-status-label');
// const iceStatusLabel = document.getElementById('ice-status-label');
// const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
// const signalingStatusLabel = document.getElementById('signaling-status-label');
// const streamingStatusLabel = document.getElementById('streaming-status-label');

const presenterInputByService = {
  talks: {
    source_url: 'https://tmc.dev/agent-1.jpeg',
  },
  clips: {
    presenter_id: 'rian-lZC6MmWfC1',
    driver_id: 'mXra4jY38i'
  }
}

// const connectButton = document.getElementById('connect-button');
// connectButton.onclick = async () => {
//   if (peerConnection && peerConnection.connectionState === 'connected') {
//     return;
//   }

//   stopAllStreams();
//   closePC();

//   const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Basic ${DID_API.key}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(presenterInputByService[DID_API.service]),
//   });

//   const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
//   streamId = newStreamId;
//   sessionId = newSessionId;

//   try {
//     sessionClientAnswer = await createPeerConnection(offer, iceServers);
//   } catch (e) {
//     console.log('error during streaming setup', e);
//     stopAllStreams();
//     closePC();
//     return;
//   }

//   const sdpResponse = await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}/sdp`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Basic ${DID_API.key}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       answer: sessionClientAnswer,
//       session_id: sessionId,
//     }),
//   });
// };

// const startButton = document.getElementById('start-button');
// startButton.onclick = async () => {
//   // connectionState not supported in firefox
//   if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
//     const playResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Basic ${DID_API.key}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         script: {
//           type: 'text',
//           input: 'this is an arbitrary sentence we have supplied for the purpose of this demo',
//         },
//         ...(DID_API.service === 'clips' && {
//           background: {
//             color: '#FFFFFF'
//           }
//         }),
//         config: {
//           stitch: true,
//         },
//         session_id: sessionId,
//       }),
//     });
//   }
// };

// const destroyButton = document.getElementById('destroy-button');
// destroyButton.onclick = async () => {
//   await fetch(`${DID_API.url}/${DID_API.service}/streams/${streamId}`, {
//     method: 'DELETE',
//     headers: {
//       Authorization: `Basic ${DID_API.key}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ session_id: sessionId }),
//   });

//   stopAllStreams();
//   closePC();
// };

function onIceGatheringStateChange() {
  refs.iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  refs.iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
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
  refs.iceStatusLabel.innerText = peerConnection.iceConnectionState;
  refs.iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  refs.peerStatusLabel.innerText = peerConnection.connectionState;
  refs.peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}
function onSignalingStateChange() {
  refs.signalingStatusLabel.innerText = peerConnection.signalingState;
  refs.signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
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
  refs.streamingStatusLabel.innerText = status;
  refs.streamingStatusLabel.className = 'streamingState-' + status;
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
  refs.videoElement.srcObject = stream;
  refs.videoElement.loop = false;

  // safari hotfix
  if (refs.videoElement.paused) {
    refs.videoElement
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  refs.videoElement.srcObject = undefined;
  refs.videoElement.src = DID_API.service == 'clips' ? 'rian_idle.mp4' : 'or_idle.mp4';
  refs.videoElement.loop = true;
}

function stopAllStreams() {
  if (refs.videoElement.srcObject) {
    console.log('stopping video streams');
    refs.videoElement.srcObject.getTracks().forEach((track) => track.stop());
    refs.videoElement.srcObject = null;
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
  refs.iceGatheringStatusLabel.innerText = '';
  refs.signalingStatusLabel.innerText = '';
  refs.iceStatusLabel.innerText = '';
  refs.peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}


let refs = {};

export function initializeStreamingClient({
  videoElement,
  connectButton,
  startButton,
  destroyButton,
  iceGatheringStatusLabel,
  iceStatusLabel,
  peerStatusLabel,
  signalingStatusLabel,
  streamingStatusLabel,
}) {
  refs.videoElement = videoElement;
  refs.connectButton = connectButton;
  refs.startButton = startButton;
  refs.destroyButton = destroyButton;
  refs.iceGatheringStatusLabel = iceGatheringStatusLabel;
  refs.iceStatusLabel = iceStatusLabel;
  refs.peerStatusLabel = peerStatusLabel;
  refs.signalingStatusLabel = signalingStatusLabel;
  refs.streamingStatusLabel = streamingStatusLabel;

  videoElement.setAttribute("playsinline", "");

  connectButton.onclick = async () => {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      return;
    }

    stopAllStreams();
    closePC();

    const sessionResponse = await fetchWithRetries(`${DID_API.url}/${DID_API.service}/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(presenterInputByService[DID_API.service]),
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
  };

  startButton.onclick = async () => {
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
          ...(DID_API.service === 'clips' && {
            background: {
              color: '#FFFFFF'
            }
          }),
          config: {
            stitch: true,
          },
          session_id: sessionId,
        }),
      });
    }
  };

  destroyButton.onclick = async () => {
    // ... (keep the existing destroy button logic)
  };

}
