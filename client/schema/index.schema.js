/** @jsx builder */
import builder from 'canner-script';
import System from './system.schema';
import Idp from './idp/identityProvider.schema';
import UserFederation from './userFederation.schema';
import User from './user.schema';
import Group from './group.schema';
import InstanceType from './instanceType.schema';
import Image from './image.schema';
import Dataset from './dataset.schema';
import {connector, storage} from './utils';

export default (
  <root connector={connector}>
    <System storage={storage} />
    <Idp storage={storage} />
    <UserFederation storage={storage} />
    <User storage={storage} />
    <Group storage={storage} />
    <InstanceType storage={storage} />
    <Image storage={storage} />
    <Dataset storage={storage} />    
  </root>
)
