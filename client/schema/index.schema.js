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
import {graphqlClient} from './utils';

export default (
  <root graphqlClient={process.env.NODE_ENV === 'production' ? graphqlClient : undefined}>
    <System/>
    <Idp/>
    <UserFederation/>
    <User/>
    <Group/>
    <InstanceType/>
    <Image/>
    <Dataset/>    
  </root>
)
