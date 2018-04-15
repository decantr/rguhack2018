#!/usr/bin/node

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// create client
const client = new speech.SpeechClient();

const encoding = 'LINEAR16';
const languageCode = 'en-US';

function file(filename){
    const fs = require('fs');

    const sampleRateHertz = 44100;

    const file = {
        content: fs.readFileSync(filename).toString('base64'),
    }

    const config = {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
    };

    const request = {
        config: config,
        audio: file,
    }

    // code lifted from googles example
    client
    .longRunningRecognize(request)
    .then(data => {
      const response = data[0];
      const operation = response;
      // Get a Promise representation of the final result of the job
      return operation.promise();
    })
    .then(data => {
      const response = data[0];
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log(`Transcription: ${transcription}`);
    })
    .catch(err => {
      console.error('ERROR:', err);
    })
}

function listen(){
    const record = require('node-record-lpcm16');
    

// set config
const sampleRateHertz = 16000;

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
}

require(`yargs`)
  .demand(1)
  .command(
    'file',
    {},
    opts => file(
        'audio.mp3'
      )
  )
  .command(
    'listen',
    {},
    opts =>
      listen()
  )
  .strict().argv;