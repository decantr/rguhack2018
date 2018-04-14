#!/usr/bin/node

// Imports the Google Cloud client library
const fs = require('fs');
const speech = require('@google-cloud/speech');
const record = require('node-record-lpcm16');

// create client
const client = new speech.SpeechClient();

// set config
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

// stream config
const config = {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
};

// request details
const request = {
    config: config,
    interimResults: false,
};

// Create a recognize stream
const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data =>
        process.stdout.write(
            data.results[0] && data.results[0].alternatives[0] ?
            `Transcription: ${data.results[0].alternatives[0].transcript}\n` :
            `\n\nReached transcription time limit, press Ctrl+C\n`
        )
    );

// Start recording and send the microphone input to the Speech API
record
    .start({
        sampleRateHertz: sampleRateHertz,
        threshold: 0,
        // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
        verbose: false,
        recordProgram: 'rec', // Try also "arecord" or "sox"
        silence: '10.0',
    })
    .on('error', console.error)
    .pipe(recognizeStream);

console.log('Listening, press Ctrl+C to stop.');
// [END speech_streaming_mic_recognize]
// }