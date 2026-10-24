import app from '../.output/server/index.mjs';
import { withBasicAuth } from './auth.mjs';


export default withBasicAuth(app);
