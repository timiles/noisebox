/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');
const path = require('path');

const WORKER_FILE = './src/workers/registerWorkerFunctions.ts';
const WORKER_BUNDLE_FILE = './public/worker.bundle.js';

function buildWorkerBundle(workerFile, workerBundleFile) {
  return new Promise((resolve, reject) => {
    const config = {
      entry: workerFile,
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        alias: {
          // Register relative paths here
          types: path.resolve(__dirname, 'src/types'),
          utils: path.resolve(__dirname, 'src/utils'),
        },
        extensions: ['.tsx', '.ts', '.js'],
      },
      output: {
        filename: workerBundleFile,
        path: __dirname,
      },
      mode: 'production',
    };

    webpack(config).run((err, stats) => {
      if (err) {
        console.log(err);
      }

      process.stdout.write(`${stats.toString()}\n`);

      if (stats.hasErrors()) {
        reject(new Error(`Webpack errors:\n${stats.toJson().errors.join('\n')}`));
      }

      resolve();
    });
  });
}

async function build() {
  try {
    console.log(`\nWorker file ${WORKER_FILE}`);

    await buildWorkerBundle(WORKER_FILE, WORKER_BUNDLE_FILE);
    console.log(`\nBuilt worker bundle ${WORKER_BUNDLE_FILE}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

build();
