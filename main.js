// // scripts.js
// function showAlert() {
//     alert('Welcome to Deepgram! Experience the best in AI speech recognition.');
// }


// app.js
const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');

let socket;
let mediaRecorder;
let audioChunks = [];

startBtn.addEventListener('click', () => {
  if (startBtn.textContent === 'Начать запись') {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      sendAudioToDeepgram(audioBlob);
      audioChunks = [];
    };
    mediaRecorder.start();
    startBtn.textContent = 'Остановить запись';
    statusEl.textContent = 'Статус: Запись идет...';
    connectToDeepgram();
  } catch (err) {
    console.error('Ошибка доступа к микрофону:', err);
    statusEl.textContent = 'Статус: Ошибка доступа к микрофону';
  }
}

function stopRecording() {
  mediaRecorder.stop();
  startBtn.textContent = 'Начать запись';
  statusEl.textContent = 'Статус: Ожидание...';
  socket.close();
}

function connectToDeepgram() {
  const apiKey = 'ВАШ_API_КЛЮЧ'; // Замените на ваш API ключ Deepgram
  const url = `wss://api.deepgram.com/v1/listen?access_token=${apiKey}&encoding=linear16&sample_rate=16000`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    statusEl.textContent = 'Статус: Подключено';
  };

  socket.onmessage = event => {
    const response = JSON.parse(event.data);
    if (response.channel && response.channel.alternatives) {
      const transcript = response.channel.alternatives[0].transcript;
      transcriptEl.textContent = `Транскрипция: ${transcript}`;
    }
  };

  socket.onerror = err => {
    console.error('Ошибка WebSocket:', err);
    statusEl.textContent = 'Статус: Ошибка подключения';
  };

  socket.onclose = () => {
    statusEl.textContent = 'Статус: Отключено';
  };
}

function sendAudioToDeepgram(audioBlob) {
  if (socket.readyState === WebSocket.OPEN) {
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = reader.result.split(',')[1];
      socket.send(audioData);
    };
    reader.readAsDataURL(audioBlob);
  } else {
    console.error('WebSocket не открыт');
  }
}
