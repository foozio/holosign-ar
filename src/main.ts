import './style.css'
import { App } from './ui/App'
import { setupTFJS } from './ml/BackendSetup'

async function init() {
    await setupTFJS();
    new App('app');
}

init();
// Loop is started in constructor

