import React from 'react';
import firebase from 'firebase';
import {FirebaseClientService} from '@canner/image-service-config';
import {GraphqlClient} from 'canner-graphql-interface';
import {ImgurService} from '@canner/image-service-config';
import store from 'store';

exports.storage = new ImgurService({
  clientId: "cd7b1ab0aa39732",
  mashapeKey: "bF1fkS9EKrmshtCbRspDUxPL5yhCp1rzz8ejsnqLqwI2KQC3s9"
}).getServiceConfig();
exports.renderRelationField = function(text, record) {
  return <span>
    {text.length}
  </span>
}

exports.dict = {
  en: {
    system: 'System',
    name: 'Name'
  }
}