kind create cluster --config=kind-config.yaml
echo "install test-env"
helm upgrade primehub-console-test-env . --install
