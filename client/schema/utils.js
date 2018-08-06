import React from 'react';
import firebase from 'firebase';
import {FirebaseClientService} from '@canner/image-service-config';
import {GraphqlClient} from 'canner-graphql-interface';
import {ImgurService} from '@canner/image-service-config';

exports.graphqlClient = new GraphqlClient({
  uri: "/graphql"
});

exports.storage = new ImgurService({
  clientId: "cd7b1ab0aa39732",
  mashapeKey: "bF1fkS9EKrmshtCbRspDUxPL5yhCp1rzz8ejsnqLqwI2KQC3s9"
}).getServiceConfig();
exports.renderRelationField = function(text, record) {
  return <span>
    {text.length}
  </span>
}