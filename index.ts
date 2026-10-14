import { registerRootComponent } from 'expo';

import App from './src/App';
import { initClarity } from './src/utils/clarity';

initClarity();

registerRootComponent(App);
