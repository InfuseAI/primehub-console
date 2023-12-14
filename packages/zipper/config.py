import os
import re
from typing import Any, Dict
import yaml


class MinIOConfig:
    def __init__(self, args: Dict[str, Any]) -> None:
        self.end_point = args["end_point"]
        self.access_key = args["access_key"]
        self.secret_key = args["secret_key"]
        self.bucket = args["bucket"]


class Config:
    """
    Represents the configuration as configured in config.yaml
    """

    def __init__(self, configfile: str) -> None:
        config = self._parse_config(configfile)
        self.minio_config = MinIOConfig(config["minio_config"])

    @staticmethod
    def _parse_config(path=None, data=None):
        """
        Load a yaml configuration file and resolve any environment variables and read file contents.
        The environment variables must have !ENV before them and be in this format
        to be parsed: ${VAR_NAME}.
        The path variables must have !ENV before them and be in this format
        to be parsed: ${VAR_NAME}.
        E.g.:

        database:
            host: !ENV ${HOST}
            port: !ENV ${PORT}
            password: !CONTENT /tmp/secrets/database-password
        app:
            log_path: !ENV '/var/${LOG_PATH}'
            something_else: !ENV '${AWESOME_ENV_VAR}/var/${A_SECOND_AWESOME_VAR}'

        :param str path: the path to the yaml file
        :param str data: the yaml data itself as a stream
        :param str tag: the tag to look for
        :return: the dict configuration
        :rtype: dict[str, T]
        """

        loader = yaml.SafeLoader

        # the tag will be used to mark where to start searching for the pattern
        # e.g. somekey: !ENV somestring${MYENVVAR}blah blah blah
        env_tag = "!ENV"
        # pattern for global vars: look for ${word}
        env_pattern = re.compile(r".*?\$\{(\w+)\}.*?")
        loader.add_implicit_resolver(env_tag, env_pattern, None)

        def constructor_env_variables(loader, node):
            """
            Extracts the environment variable from the node's value
            :param yaml.Loader loader: the yaml loader
            :param node: the current node in the yaml
            :return: the parsed string that contains the value of the environment
            variable
            """
            value = loader.construct_scalar(node)
            # to find all env variables in line
            match = env_pattern.findall(value)
            if match:
                full_value = value
                for grp in match:
                    full_value = full_value.replace(
                        f"${{{grp}}}", os.environ.get(grp, grp)
                    )
                return full_value
            return value

        loader.add_constructor(env_tag, constructor_env_variables)

        # the tag will be used to mark where to start searching for the pattern
        # e.g. somekey: !CONTENT ./asd/data
        content_tag = "!CONTENT"
        # pattern for global vars: look for ${word}
        content_pattern = re.compile(r"\s+(\S+)\s*")
        loader.add_implicit_resolver(content_tag, content_pattern, None)

        def constructor_content_variables(loader, node):
            """
            Extracts the file path variable from the node's value
            :param yaml.Loader loader: the yaml loader
            :param node: the current node in the yaml
            :return: the parsed string that contains the value of the file
            """
            value = loader.construct_scalar(node)
            with open(value, encoding="utf-8") as f:
                return f.read()

        loader.add_constructor(content_tag, constructor_content_variables)

        if path:
            with open(path, encoding="utf-8") as conf_data:
                return yaml.load(conf_data, Loader=loader)
        elif data:
            return yaml.load(data, Loader=loader)
        else:
            raise ValueError("Either a path or data should be defined as input")
