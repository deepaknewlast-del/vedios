import { Config } from '@remotion/cli/config';

// The sandbox has no system Chrome and no access to Google's browser CDN, so we
// point Remotion at the locally extracted Chromium (see scripts/render.sh).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}

Config.setVideoImageFormat('jpeg');
Config.setStillImageFormat('png');
Config.setOverwriteOutput(true);
Config.setChromiumDisableWebSecurity(true);
