/** @jsx builder */
import builder from 'canner-script';
import System from './system.schema';
import Idp from './idp/identityProvider.schema';
import UserFederation from './userFederation.schema';
import User from './user.schema';
import Group from './group.schema';
import MachineType from './machineType.schema';
import Env from './env.schema';
import Dataset from './dataset.schema';

export default (
  <root>
    <System />
    <Idp />
    <UserFederation />
    <User />
    <Group />
    <MachineType />
    <Env />
    <Dataset />    
  </root>
)
