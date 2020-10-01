# node-koofr-uploader

Takes a sample file `test-document.txt` which you can find in this repository. 
Zips it up with `tar`, uploads it to Koofr. 
Then it deletes files older than specified in the config.

## Usage
- copy `.env.example` to `.env` so that dotenv can pick up your env variables
- run `npm install`
- run with `npm run start`
