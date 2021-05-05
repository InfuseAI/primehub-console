export const modelVersions = [
  {
    "group": "group1",
    "name": "Hello",
    "version": "1",
    "description": "",
    "creationTimestamp": "1617865867887",
    "lastUpdatedTimestamp": "1617872757470",
    "run": {
      "info": {
        "runId": "ff02a452eb27403ba60fa09f3fee3d5c",
        "experimentId": "0",
        "status": "FINISHED",
        "startTime": "1616314045297",
        "endTime": "1616314075680",
        "artifactUri": "/tmp/mlruns/0/ff02a452eb27403ba60fa09f3fee3d5c/artifacts",
        "lifecycleStage": "active"
      },
      "data": {
        "metrics": [
          {
            "key": "loss",
            "value": 0.21975938975811005,
            "timestamp": "1616314054434",
            "step": "0"
          },
          {
            "key": "accuracy",
            "value": 0.9343166947364807,
            "timestamp": "1616314054434",
            "step": "0"
          },
          {
            "key": "val_loss",
            "value": 0.10696936398744583,
            "timestamp": "1616314054434",
            "step": "0"
          },
          {
            "key": "val_accuracy",
            "value": 0.9674000144004822,
            "timestamp": "1616314054434",
            "step": "0"
          }
        ],
        "params": [
          {
            "key": "epochs",
            "value": "5"
          },
          {
            "key": "batch_size",
            "value": "None"
          },
          {
            "key": "validation_split",
            "value": "0.0"
          },
          {
            "key": "shuffle",
            "value": "True"
          },
          {
            "key": "class_weight",
            "value": "None"
          },
          {
            "key": "sample_weight",
            "value": "None"
          },
          {
            "key": "initial_epoch",
            "value": "0"
          },
          {
            "key": "steps_per_epoch",
            "value": "None"
          },
          {
            "key": "validation_steps",
            "value": "None"
          },
          {
            "key": "validation_batch_size",
            "value": "None"
          },
          {
            "key": "validation_freq",
            "value": "1"
          },
          {
            "key": "max_queue_size",
            "value": "10"
          },
          {
            "key": "workers",
            "value": "1"
          },
          {
            "key": "use_multiprocessing",
            "value": "False"
          },
          {
            "key": "opt_name",
            "value": "Adam"
          },
          {
            "key": "opt_learning_rate",
            "value": "0.001"
          },
          {
            "key": "opt_decay",
            "value": "0.0"
          },
          {
            "key": "opt_beta_1",
            "value": "0.9"
          },
          {
            "key": "opt_beta_2",
            "value": "0.999"
          },
          {
            "key": "opt_epsilon",
            "value": "1e-07"
          },
          {
            "key": "opt_amsgrad",
            "value": "False"
          }
        ],
        "tags": [
          {
            "key": "mlflow.user",
            "value": "popcorny"
          },
          {
            "key": "mlflow.source.name",
            "value": "train.py"
          },
          {
            "key": "mlflow.source.type",
            "value": "LOCAL"
          },
          {
            "key": "mlflow.source.git.commit",
            "value": "a32a1601b0870ac651d9a070602e62dfe32dd3db"
          },
          {
            "key": "mlflow.autologging",
            "value": "tensorflow"
          },
          {
            "key": "mlflow.log-model.history",
            "value": "[{\"run_id\": \"ff02a452eb27403ba60fa09f3fee3d5c\", \"artifact_path\": \"model\", \"utc_time_created\": \"2021-03-21 08:07:55.057028\", \"flavors\": {\"keras\": {\"keras_module\": \"tensorflow.keras\", \"keras_version\": \"2.4.0\", \"save_format\": \"tf\", \"data\": \"data\"}, \"python_function\": {\"loader_module\": \"mlflow.keras\", \"python_version\": \"3.7.2\", \"data\": \"data\", \"env\": \"conda.yaml\"}}}]"
          }
        ]
      }
    }
  },
  {
    "group": "group1",
    "name": "Hello",
    "version": "3",
    "description": "",
    "creationTimestamp": "1617933805566",
    "lastUpdatedTimestamp": "1617934283443",
    "run": {
      "info": {
        "runId": "a886396463ed431490db61dd08a77982",
        "experimentId": "0",
        "status": "FINISHED",
        "startTime": "1617866614872",
        "endTime": "1617866647812",
        "artifactUri": "/tmp/mlruns/0/a886396463ed431490db61dd08a77982/artifacts",
        "lifecycleStage": "active"
      },
      "data": {
        "metrics": [
          {
            "key": "loss",
            "value": 0.2158307135105133,
            "timestamp": "1617866622634",
            "step": "0"
          },
          {
            "key": "accuracy",
            "value": 0.9358333349227905,
            "timestamp": "1617866622634",
            "step": "0"
          },
          {
            "key": "val_loss",
            "value": 0.1073286160826683,
            "timestamp": "1617866622634",
            "step": "0"
          },
          {
            "key": "val_accuracy",
            "value": 0.9646000266075134,
            "timestamp": "1617866622634",
            "step": "0"
          }
        ],
        "params": [
          {
            "key": "epochs",
            "value": "5"
          },
          {
            "key": "batch_size",
            "value": "None"
          },
          {
            "key": "validation_split",
            "value": "0.0"
          },
          {
            "key": "shuffle",
            "value": "True"
          },
          {
            "key": "class_weight",
            "value": "None"
          },
          {
            "key": "sample_weight",
            "value": "None"
          },
          {
            "key": "initial_epoch",
            "value": "0"
          },
          {
            "key": "steps_per_epoch",
            "value": "None"
          },
          {
            "key": "validation_steps",
            "value": "None"
          },
          {
            "key": "validation_batch_size",
            "value": "None"
          },
          {
            "key": "validation_freq",
            "value": "1"
          },
          {
            "key": "max_queue_size",
            "value": "10"
          },
          {
            "key": "workers",
            "value": "1"
          },
          {
            "key": "use_multiprocessing",
            "value": "False"
          },
          {
            "key": "opt_name",
            "value": "Adam"
          },
          {
            "key": "opt_learning_rate",
            "value": "0.001"
          },
          {
            "key": "opt_decay",
            "value": "0.0"
          },
          {
            "key": "opt_beta_1",
            "value": "0.9"
          },
          {
            "key": "opt_beta_2",
            "value": "0.999"
          },
          {
            "key": "opt_epsilon",
            "value": "1e-07"
          },
          {
            "key": "opt_amsgrad",
            "value": "False"
          }
        ],
        "tags": [
          {
            "key": "mlflow.user",
            "value": "popcorny"
          },
          {
            "key": "mlflow.source.name",
            "value": "train.py"
          },
          {
            "key": "mlflow.source.type",
            "value": "LOCAL"
          },
          {
            "key": "mlflow.source.git.commit",
            "value": "a32a1601b0870ac651d9a070602e62dfe32dd3db"
          },
          {
            "key": "mlflow.autologging",
            "value": "tensorflow"
          },
          {
            "key": "mlflow.log-model.history",
            "value": "[{\"run_id\": \"a886396463ed431490db61dd08a77982\", \"artifact_path\": \"model\", \"utc_time_created\": \"2021-04-08 07:24:07.076401\", \"flavors\": {\"keras\": {\"keras_module\": \"tensorflow.keras\", \"keras_version\": \"2.4.0\", \"save_format\": \"tf\", \"data\": \"data\"}, \"python_function\": {\"loader_module\": \"mlflow.keras\", \"python_version\": \"3.7.2\", \"data\": \"data\", \"env\": \"conda.yaml\"}}}]"
          },
          {
            "key": "mlflow.runName",
            "value": "xxyyzz"
          }
        ]
      }
    }
  },
  {
    "group": "group1",
    "name": "Hello",
    "version": "4",
    "description": "",
    "creationTimestamp": "1617934246402",
    "lastUpdatedTimestamp": "1617934283443",
    "run": {
      "info": {
        "runId": "c11f8b6adabd4d95bbae0cb2a9d5c859",
        "experimentId": "0",
        "status": "FINISHED",
        "startTime": "1617934133252",
        "endTime": "1617934174891",
        "artifactUri": "/tmp/mlruns/0/c11f8b6adabd4d95bbae0cb2a9d5c859/artifacts",
        "lifecycleStage": "active"
      },
      "data": {
        "metrics": [
          {
            "key": "loss",
            "value": 0.21771515905857086,
            "timestamp": "1617934144687",
            "step": "0"
          },
          {
            "key": "accuracy",
            "value": 0.9348499774932861,
            "timestamp": "1617934144687",
            "step": "0"
          },
          {
            "key": "val_loss",
            "value": 0.10595808178186417,
            "timestamp": "1617934144687",
            "step": "0"
          },
          {
            "key": "val_accuracy",
            "value": 0.9681000113487244,
            "timestamp": "1617934144687",
            "step": "0"
          }
        ],
        "params": [
          {
            "key": "epochs",
            "value": "5"
          },
          {
            "key": "batch_size",
            "value": "None"
          },
          {
            "key": "validation_split",
            "value": "0.0"
          },
          {
            "key": "shuffle",
            "value": "True"
          },
          {
            "key": "class_weight",
            "value": "None"
          },
          {
            "key": "sample_weight",
            "value": "None"
          },
          {
            "key": "initial_epoch",
            "value": "0"
          },
          {
            "key": "steps_per_epoch",
            "value": "None"
          },
          {
            "key": "validation_steps",
            "value": "None"
          },
          {
            "key": "validation_batch_size",
            "value": "None"
          },
          {
            "key": "validation_freq",
            "value": "1"
          },
          {
            "key": "max_queue_size",
            "value": "10"
          },
          {
            "key": "workers",
            "value": "1"
          },
          {
            "key": "use_multiprocessing",
            "value": "False"
          },
          {
            "key": "opt_name",
            "value": "Adam"
          },
          {
            "key": "opt_learning_rate",
            "value": "0.001"
          },
          {
            "key": "opt_decay",
            "value": "0.0"
          },
          {
            "key": "opt_beta_1",
            "value": "0.9"
          },
          {
            "key": "opt_beta_2",
            "value": "0.999"
          },
          {
            "key": "opt_epsilon",
            "value": "1e-07"
          },
          {
            "key": "opt_amsgrad",
            "value": "False"
          }
        ],
        "tags": [
          {
            "key": "mlflow.user",
            "value": "popcorny"
          },
          {
            "key": "mlflow.source.name",
            "value": "train.py"
          },
          {
            "key": "mlflow.source.type",
            "value": "LOCAL"
          },
          {
            "key": "mlflow.source.git.commit",
            "value": "a32a1601b0870ac651d9a070602e62dfe32dd3db"
          },
          {
            "key": "mlflow.autologging",
            "value": "tensorflow"
          },
          {
            "key": "mlflow.log-model.history",
            "value": "[{\"run_id\": \"c11f8b6adabd4d95bbae0cb2a9d5c859\", \"artifact_path\": \"model\", \"utc_time_created\": \"2021-04-09 02:09:34.064528\", \"flavors\": {\"keras\": {\"keras_module\": \"tensorflow.keras\", \"keras_version\": \"2.4.0\", \"save_format\": \"tf\", \"data\": \"data\"}, \"python_function\": {\"loader_module\": \"mlflow.keras\", \"python_version\": \"3.7.2\", \"data\": \"data\", \"env\": \"conda.yaml\"}}}]"
          }
        ]
      }
    }
  },
  {
    "group": "group1",
    "name": "Hello",
    "version": "5",
    "description": "",
    "creationTimestamp": "1618538104273",
    "lastUpdatedTimestamp": "1618538104273",
    "run": {
      "info": {
        "runId": "b92a8c4165bc4bca9c928ace588d05d8",
        "experimentId": "0",
        "status": "FINISHED",
        "startTime": "1618538010499",
        "endTime": "1618538062582",
        "artifactUri": "/tmp/mlruns/0/b92a8c4165bc4bca9c928ace588d05d8/artifacts",
        "lifecycleStage": "active"
      },
      "data": {
        "metrics": [
          {
            "key": "loss",
            "value": 0.21818868815898895,
            "timestamp": "1618538024028",
            "step": "0"
          },
          {
            "key": "accuracy",
            "value": 0.9348833560943604,
            "timestamp": "1618538024028",
            "step": "0"
          },
          {
            "key": "val_loss",
            "value": 0.10610220581293106,
            "timestamp": "1618538024028",
            "step": "0"
          },
          {
            "key": "val_accuracy",
            "value": 0.9679999947547913,
            "timestamp": "1618538024028",
            "step": "0"
          }
        ],
        "params": [
          {
            "key": "epochs",
            "value": "5"
          },
          {
            "key": "batch_size",
            "value": "None"
          },
          {
            "key": "validation_split",
            "value": "0.0"
          },
          {
            "key": "shuffle",
            "value": "True"
          },
          {
            "key": "class_weight",
            "value": "None"
          },
          {
            "key": "sample_weight",
            "value": "None"
          },
          {
            "key": "initial_epoch",
            "value": "0"
          },
          {
            "key": "steps_per_epoch",
            "value": "None"
          },
          {
            "key": "validation_steps",
            "value": "None"
          },
          {
            "key": "validation_batch_size",
            "value": "None"
          },
          {
            "key": "validation_freq",
            "value": "1"
          },
          {
            "key": "max_queue_size",
            "value": "10"
          },
          {
            "key": "workers",
            "value": "1"
          },
          {
            "key": "use_multiprocessing",
            "value": "False"
          },
          {
            "key": "opt_name",
            "value": "Adam"
          },
          {
            "key": "opt_learning_rate",
            "value": "0.001"
          },
          {
            "key": "opt_decay",
            "value": "0.0"
          },
          {
            "key": "opt_beta_1",
            "value": "0.9"
          },
          {
            "key": "opt_beta_2",
            "value": "0.999"
          },
          {
            "key": "opt_epsilon",
            "value": "1e-07"
          },
          {
            "key": "opt_amsgrad",
            "value": "False"
          }
        ],
        "tags": [
          {
            "key": "mlflow.user",
            "value": "popcorny"
          },
          {
            "key": "mlflow.source.name",
            "value": "train.py"
          },
          {
            "key": "mlflow.source.type",
            "value": "LOCAL"
          },
          {
            "key": "mlflow.source.git.commit",
            "value": "a32a1601b0870ac651d9a070602e62dfe32dd3db"
          },
          {
            "key": "mlflow.autologging",
            "value": "tensorflow"
          },
          {
            "key": "mlflow.log-model.history",
            "value": "[{\"run_id\": \"b92a8c4165bc4bca9c928ace588d05d8\", \"artifact_path\": \"model\", \"utc_time_created\": \"2021-04-16 01:54:21.600951\", \"flavors\": {\"keras\": {\"keras_module\": \"tensorflow.keras\", \"keras_version\": \"2.4.0\", \"save_format\": \"tf\", \"data\": \"data\"}, \"python_function\": {\"loader_module\": \"mlflow.keras\", \"python_version\": \"3.7.2\", \"data\": \"data\", \"env\": \"conda.yaml\"}}}]"
          }
        ]
      }
    }
  },
  {
    "group": "group1",
    "name": "is/this\a$valid#model?",
    "version": "1",
    "description": "",
    "creationTimestamp": "1617865867887",
    "lastUpdatedTimestamp": "1617872757470",
  },
  {
    "group": "group2",
    "name": "model-group2",
    "version": "1",
    "description": "",
    "creationTimestamp": "1617865867887",
    "lastUpdatedTimestamp": "1617872757470",
  },
];

export default modelVersions;
