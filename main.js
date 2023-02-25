const dimensions = document.querySelector('#dimensions');
const video = document.querySelector('video');
let stream;

const vgaButton = document.querySelector('#vga');
const qvgaButton = document.querySelector('#qvga');
const hdButton = document.querySelector('#hd');
const fullHdButton = document.querySelector('#full-hd');
const cinemaFourKButton = document.querySelector('#cinemaFourK');
const televisionFourKButton = document.querySelector('#televisionFourK');
const eightKButton = document.querySelector('#eightK');

const captureButton = document.querySelector('#capture');
const canvas = document.querySelector('#canvas');
const canvasWrapper = document.querySelector('#canvas-wrapper');
const capturedImage = document.querySelector('#captured-image');
const downloadImage = document.querySelector('#download-image');

const videoblock = document.querySelector('#videoblock');
const messagebox = document.querySelector('#errormessage');

// const widthInput = document.querySelector('div#width input');
// const widthOutput = document.querySelector('div#width span');
const aspectLock = document.querySelector('#aspectlock');
const sizeLock = document.querySelector('#sizelock');

let currentWidth = 0;
let currentHeight = 0;

const videoSelect = document.querySelector('select#videoSource');
const selectors = [videoSelect];

vgaButton.onclick = () => {
    getMedia(vgaConstraints);
};

qvgaButton.onclick = () => {
    getMedia(qvgaConstraints);
};

hdButton.onclick = () => {
    getMedia(hdConstraints);
};

fullHdButton.onclick = () => {
    getMedia(fullHdConstraints);
};

televisionFourKButton.onclick = () => {
    getMedia(televisionFourKConstraints);
};

cinemaFourKButton.onclick = () => {
    getMedia(cinemaFourKConstraints);
};

eightKButton.onclick = () => {
    getMedia(eightKConstraints);
};

captureButton.onclick = () => {
    capture();
};

downloadImage.onclick = () => {
    var downloadLink = document.createElement('a');
    downloadLink.href = capturedImage.src
        .replace("image/jpeg", "image/octet-stream");
    downloadLink.download = 'pearl-camera-photo.jpeg';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function capture() {
    canvasWrapper.style.display = 'block';
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    var context = canvas.getContext("2d")
        .drawImage(video, 0, 0, currentWidth, currentHeight);
    capturedImage.src = canvas.toDataURL("image/jpeg");
    //this.captures.push(canvas.toDataURL("image/png"));
    canvasWrapper.scrollIntoView();
}

const qvgaConstraints = {
    video: { width: { exact: 320 }, height: { exact: 240 } }
};

const vgaConstraints = {
    video: { width: { exact: 640 }, height: { exact: 480 } }
};

const hdConstraints = {
    video: { width: { exact: 1280 }, height: { exact: 720 } }
};

const fullHdConstraints = {
    video: { width: { exact: 1920 }, height: { exact: 1080 } }
};

const televisionFourKConstraints = {
    video: { width: { exact: 3840 }, height: { exact: 2160 } }
};

const cinemaFourKConstraints = {
    video: { width: { exact: 4096 }, height: { exact: 2160 } }
};

const eightKConstraints = {
    video: { width: { exact: 7680 }, height: { exact: 4320 } }
};

function gotStream(mediaStream) {
    stream = window.stream = mediaStream; // stream available to console
    video.srcObject = mediaStream;
    messagebox.style.display = 'none';
    videoblock.style.display = 'block';
    const track = mediaStream.getVideoTracks()[0];
    const constraints = track.getConstraints();
    console.log('Result constraints: ' + JSON.stringify(constraints));
    if (constraints && constraints.width && constraints.width.exact) {
        //widthInput.value = constraints.width.exact;
        //widthOutput.textContent = constraints.width.exact;
    } else if (constraints && constraints.width && constraints.width.min) {
        //widthInput.value = constraints.width.min;
        //widthOutput.textContent = constraints.width.min;
    }
    return navigator.mediaDevices.enumerateDevices();
}

function errorMessage(who, what) {
    const message = who + ': ' + what;
    messagebox.innerText = message;
    messagebox.style.display = 'block';
    console.log(message);
}

function clearErrorMessage() {
    messagebox.style.display = 'none';
}

function displayVideoDimensions(whereSeen) {
    if (video.videoWidth) {
        dimensions.innerText = 'Actual video dimensions: ' + video.videoWidth +
            'x' + video.videoHeight + 'px.';
        if (currentWidth !== video.videoWidth ||
            currentHeight !== video.videoHeight) {
            console.log(whereSeen + ': ' + dimensions.innerText);
            currentWidth = video.videoWidth;
            currentHeight = video.videoHeight;
        }
    } else {
        dimensions.innerText = 'Video not ready';
    }
}

video.onloadedmetadata = () => {
    displayVideoDimensions('loadedmetadata');
};

video.onresize = () => {
    displayVideoDimensions('resize');
};

function constraintChange(e) {
    widthOutput.textContent = e.target.value;
    const track = window.stream.getVideoTracks()[0];
    let constraints;
    if (aspectLock.checked) {
        constraints = {
            width: { exact: e.target.value },
            aspectRatio: {
                exact: video.videoWidth / video.videoHeight
            }
        };
    } else {
        constraints = { width: { exact: e.target.value } };
    }
    clearErrorMessage();
    console.log('applying ' + JSON.stringify(constraints));
    track.applyConstraints(constraints)
        .then(() => {
            console.log('applyConstraint success');
            displayVideoDimensions('applyConstraints');
        })
        .catch(err => {
            errorMessage('applyConstraints', err.name);
        });
}

//widthInput.onchange = constraintChange;

// sizeLock.onchange = () => {
//     if (sizeLock.checked) {
//         console.log('Setting fixed size');
//         video.style.width = '100%';
//     } else {
//         console.log('Setting auto size');
//         video.style.width = 'auto';
//     }
// };

function getMedia(dimensionConstraints) {
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    clearErrorMessage();
    videoblock.style.display = 'none';
    const constraints = {
        ...dimensionConstraints,
    }
    constraints.video.deviceId = videoSelect.value ? { exact: videoSelect.value } : undefined;
    navigator.mediaDevices.getUserMedia(constraints)
        .then(gotStream)
        .catch(e => {
            errorMessage('getUserMedia', e.message, e.name);
        });
}

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            // option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            // audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            // option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            // audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}

function handleSelectVideoError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}
//navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleSelectVideoError);

function start() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    //const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        //audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleSelectVideoError);
}

videoSelect.onchange = start;

//setTimeout(start, 1000);
start();