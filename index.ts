import { differenceInMinutes, format, fromUnixTime } from 'date-fns';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Koofr from 'koofr';
import * as tar from 'tar';

dotenv.config();

interface KoofrFile {
  name: string,
  type: 'file',
  modified: number, // unix timestamp * 1000
  size: number,
  contentType: string,
  hash: string,
  tags: any,
}

async function funWithKoofr() {
  if (!process.env.KOOFR_API_BASE) {
    console.log("Skipping KOOFR upload");
    return;
  }

  const client = new Koofr(process.env.KOOFR_API_BASE);
  await client.authenticate(process.env.KOOFR_EMAIL, process.env.KOOFR_PASSWORD);

  // get the mount point
  const mounts = await client.mounts();
  const mount = mounts[0];

  try {
    await client.filesMkdir(mount.id, '/', process.env.KOOFR_FOLDER);
  } catch(e) {
    // folder already exists
  }

  const filename = 'test-document.txt';

  // create an archive out of the file
  await tar.c({ gzip: true, file: `${filename}.tgz` }, [filename]);

  // put the zipped file on koofr
  const stream = fs.createReadStream(`${filename}.tgz`);
  
  const createdFilename = `test-document-${format(new Date(), "dd-MM-yyyy")}.tgz`;
  
  console.log("Creating file " + createdFilename);
  await client.filesPut(mount.id, `/${process.env.KOOFR_FOLDER}`, createdFilename, stream);

  // list all the files
  let files: KoofrFile[] = await client.filesList(mount.id, `/${process.env.KOOFR_FOLDER}`);
  console.log(files);

  // delete "old" files
  files.map(async (file: KoofrFile) => {
    const dateModified = fromUnixTime(file.modified / 1000);
    if (differenceInMinutes(new Date(), dateModified) > parseInt(process.env.KOOFR_REMOVE_OLDER_THAN, 10)) {
      console.log("Removing file " + file.name);
      await client.filesRemove(mount.id, `/${process.env.KOOFR_FOLDER}/${file.name}`);
    }
  });

}

funWithKoofr();