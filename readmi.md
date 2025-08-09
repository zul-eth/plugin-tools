

# help button
const element = document.getElementById("rc-buttons");
console.log(element);

if (element) {
  const helpButton = document.getElementById("solver-button");
  console.log(helpButton);

  if (helpButton) {
    helpButton.click();
    console.log("Help button diklik.");
  } else {
    console.log("Elemen #recaptcha-help-button tidak ditemukan.");
  }
} else {
  console.log("Elemen #rc-imageselect tidak ditemukan.");
}

function clickSolverWhenReady() {
  const host = document.querySelector('div.button-holder.help-button-holder');
  if (!host || !host.shadowRoot) return setTimeout(clickSolverWhenReady, 200);

  const btn = host.shadowRoot.querySelector('#solver-button');
  if (!btn) return setTimeout(clickSolverWhenReady, 200);

  btn.click();
}
clickSolverWhenReady();


# cp -r artifacts/chrome/buster_captcha_solver_for_humans-3.1.0-chrome.zip /home/azureuser/
# scp -i ~/sshkey.pem -r azureuser@52.230.96.30:/home/azureuser/buster_captcha_solver_for_humans-3.1.0-chrome.zip ~/node/src/

# cp -r src /home/azureuser/
#scp -i ~/sshkey.pem -r azureuser@52.230.96.30:/home/azureuser/src/ ~/node/src/

# clone repository (replace <version>)
git clone --depth 1 --branch v3.1.0 https://github.com/dessant/buster.git
cd buster

# install Node.js version specified in .nvmrc
nvm install

# install dependencies
npm install --legacy-peer-deps

# build for Chrome
npm run build:prod:zip:chrome

# build for Edge
npm run build:prod:zip:edge

# build for Firefox
npm run build:prod:zip:firefox

# build for Opera
npm run build:prod:zip:opera