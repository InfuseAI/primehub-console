// tslint:disable:no-unused-expression
import chai from 'chai';
import chaiHttp = require('chai-http');
import faker from 'faker';
import { cleanupImages } from './sandbox';
import { pick } from 'lodash';

chai.use(chaiHttp);

const expect = chai.expect;

// utils
const fields = `
  id
  name
  displayName
  description
  useImagePullSecret
  type
  url
  urlForGpu
  global
  spec
  groups {
    id
    name
    displayName
    quotaCpu
    quotaGpu
  }`;

const customImageFields = `
  id
  name
  imageSpec {
    baseImage
    pullSecret
    packages {
      apt
      pip
      conda
    }
    cancel
  }`;

declare module 'mocha' {
  // tslint:disable-next-line:interface-name
  interface ISuiteCallbackContext {
    graphqlRequest?: (query: string, variables?: any) => Promise<any>;
    currentImage?: any;
  }
}

describe('image graphql', function() {
  before(async () => {
    this.graphqlRequest = (global as any).graphqlRequest;
    await (global as any).authKcAdmin();
  });

  after(async () => {
    await cleanupImages();
  });

  it('query images', async () => {
    const data = await this.graphqlRequest(`{
      images {${fields}}
    }`);
    expect(data.images).to.be.eql([]);
  });

  it('create a image with only name', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      type: 'both',
      url: null,
      urlForGpu: null,
      useImagePullSecret: '',
      global: false,
      spec: {
        type: 'both',
        displayName: data.name,
        pullSecret: '',
      },
      groups: []
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      name: data.name,
      displayName: data.name,
      description: null,
      type: 'both',
      url: null,
      urlForGpu: null,
      useImagePullSecret: '',
      global: false,
      spec: {
        type: 'both',
        displayName: data.name,
        pullSecret: '',
        groupName: null,
      },
      groups: []
    });
    this.currentImage = queryOne.image;
  });

  it('create a image with props and global = false', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      global: false
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      groups: [],
      useImagePullSecret: '',
      spec: {
        ...pick(data, ['displayName', 'description', 'url']),
        pullSecret: '',
        type: 'both',
        urlForGpu: data.url,
      },
      type: 'both',
      urlForGpu: data.url,
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      groups: [],
      useImagePullSecret: '',
      spec: {
        ...pick(data, ['displayName', 'description', 'url']),
        pullSecret: '',
        type: 'both',
        groupName: null,
        urlForGpu: data.url
      },
      type: 'both',
      urlForGpu: data.url,
      ...data
    });
  });

  it('create a image with props and global = true', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      global: true
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      groups: [],
      useImagePullSecret: '',
      spec: {
        ...pick(data, ['displayName', 'description', 'url']),
        type: 'both',
        urlForGpu: data.url,
        pullSecret: '',
      },
      type: 'both',
      urlForGpu: data.url,
      ...data
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      groups: [],
      useImagePullSecret: '',
      spec: {
        ...pick(data, ['displayName', 'description', 'url']),
        type: 'both',
        urlForGpu: data.url,
        pullSecret: '',
        groupName: null,
      },
      type: 'both',
      urlForGpu: data.url,
      ...data
    });
  });

  it('should query with where', async () => {
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(queryOne.image).to.be.eql(this.currentImage);
  });

  it('should create with name-only and update', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const image = createMutation.createImage;
    const data = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url()
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data
    });

    expect(mutation.updateImage).to.deep.include(data);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image).to.deep.include(data);
  });

  it('should create with props and update', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      useImagePullSecret: 'image-pull-secret'
    };
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data
    });

    // update
    const image = createMutation.createImage;
    const updateData = {
      displayName: faker.internet.userName(),
      description: faker.lorem.sentence(),
      url: faker.internet.url(),
      useImagePullSecret: 'image-pull-secret'
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: updateData
    });

    const expectedImageData = {
      ...data,
      ...updateData
    };
    expect(mutation.updateImage).to.deep.include(expectedImageData);

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image).to.deep.include(expectedImageData);
  });

  it('should create with name-only and update global twice', async () => {
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-')
      }
    });

    // update
    const image = createMutation.createImage;
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: true}
    });

    expect(mutation.updateImage.global).to.be.equals(true);

    // true again
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: true}
    });

    // update again
    const backMutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: false}
    });

    expect(backMutation.updateImage.global).to.be.equals(false);

    // false again
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: image.id},
      data: {global: false}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: image.id}
    });

    expect(queryOne.image.global).to.be.equals(false);
  });

  it('should test creating images with three different types', async () => {
    // both
    const createBothTypeMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'both',
        url: 'test'
      }
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id}
    });

    expect(queryOne.image).to.be.include({
      type: 'both',
      url: 'test',
      urlForGpu: 'test'
    });

    // both with urlForGpu
    const createBothWithUrlTypeMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'both',
        url: 'test',
        urlForGpu: 'gpu'
      }
    });

    // query one
    const queryOneWithGpu = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createBothWithUrlTypeMutation.createImage.id}
    });

    expect(queryOneWithGpu.image).to.be.include({
      type: 'both',
      url: 'test',
      urlForGpu: 'gpu'
    });

    // cpu
    const createCpuTypeMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'cpu',
        url: 'test'
      }
    });

    // query one
    const queryOneWithCpu = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createCpuTypeMutation.createImage.id}
    });

    expect(queryOneWithCpu.image).to.be.include({
      type: 'cpu',
      url: 'test',
      urlForGpu: 'test'
    });

    // gpu
    const createGpuTypeMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'gpu',
        url: 'gpu'
      }
    });

    // query one
    const queryOneWithGpuOnly = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createGpuTypeMutation.createImage.id}
    });

    expect(queryOneWithGpuOnly.image).to.be.include({
      type: 'gpu',
      url: 'gpu',
      urlForGpu: 'gpu'
    });
  });

  it('should test creating image with both type and update it', async () => {
    // both
    const createBothTypeMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'both',
        url: 'test'
      }
    });

    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id},
      data: {url: 'test2'}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id}
    });

    expect(queryOne.image).to.be.include({
      type: 'both',
      url: 'test2',
      urlForGpu: 'test2'
    });

    // update null to urlForGpu
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id},
      data: {urlForGpu: null}
    });

    // query one
    const secondQueryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id}
    });

    expect(secondQueryOne.image).to.be.include({
      type: 'both',
      url: 'test2',
      urlForGpu: 'test2'
    });

    // change to gpu
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id},
      data: {type: 'gpu'}
    });

    // query one
    const thirdQueryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createBothTypeMutation.createImage.id}
    });

    expect(thirdQueryOne.image).to.be.include({
      type: 'gpu',
      url: 'test2'
    });
  });

  it('should test creating image with gpu type and update it', async () => {
    // both
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'gpu',
        url: 'gpu-url'
      }
    });

    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id},
      data: {url: 'gpu-url2'}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id}
    });

    expect(queryOne.image).to.be.include({
      type: 'gpu',
      url: 'gpu-url2',
      urlForGpu: 'gpu-url2'
    });

    // update to both
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id},
      data: {type: 'both', url: 'url-for-cpu', urlForGpu: 'url-for-gpu'}
    });

    // query one
    const secondQueryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id}
    });

    expect(secondQueryOne.image).to.be.include({
      type: 'both',
      url: 'url-for-cpu',
      urlForGpu: 'url-for-gpu'
    });
  });

  it('should test creating image with cpu type and update it', async () => {
    // cpu
    const createMutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${fields} }
    }`, {
      data: {
        name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
        type: 'cpu',
        url: 'cpu-url'
      }
    });

    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id},
      data: {url: 'cpu-url2'}
    });

    // query one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id}
    });

    expect(queryOne.image).to.be.include({
      type: 'cpu',
      url: 'cpu-url2',
      urlForGpu: 'cpu-url2'
    });

    // update to both without other parameters
    await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!, $data: ImageUpdateInput!){
      updateImage (where: $where, data: $data) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id},
      data: {type: 'both'}
    });

    // query one
    const secondQueryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${fields} }
    }`, {
      where: {id: createMutation.createImage.id}
    });

    expect(secondQueryOne.image).to.be.include({
      type: 'both',
      url: 'cpu-url2',
      urlForGpu: 'cpu-url2'
    });
  });

  it('should delete image', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!){
      deleteImage (where: $where) { id }
    }`, {
      where: {id: this.currentImage.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: ImageWhereUniqueInput!) {
      image (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(data.image).to.be.null;
  });

  it('create a custom image', async () => {
    const data = {
      name: faker.internet.userName().toLowerCase().replace(/_/g, '-'),
      imageSpec: {
        baseImage: 'jupyter/base-notebook:foo',
        packages: {
          apt: ['curl'],
          pip: []
        }
      }
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageCreateInput!){
      createImage (data: $data) { ${customImageFields} }
    }`, {
      data
    });

    expect(mutation.createImage).to.be.eql({
      id: data.name,
      name: data.name,
      imageSpec: {
        baseImage: data.imageSpec.baseImage,
        packages: {
          apt: ['curl'],
          pip: [],
          conda: []
        },
        cancel: false,
        pullSecret: null
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${customImageFields} }
    }`, {
      where: {id: data.name}
    });

    expect(queryOne.image).to.be.eql({
      id: data.name,
      name: data.name,
      imageSpec: {
        baseImage: data.imageSpec.baseImage,
        packages: {
          apt: ['curl'],
          pip: [],
          conda: []
        },
        cancel: false,
        pullSecret: null
      }
    });
    this.currentImage = queryOne.image;
  });

  it('rebuild a custom image', async () => {
    const data = {
      baseImage: 'jupyter/base-notebook:foo',
      packages: {
        apt: ['curl', 'vim'],
        pip: ['flask']
      }
    };
    const where = {
      id: this.currentImage.name
    };
    const mutation = await this.graphqlRequest(`
    mutation($data: ImageSpecUpdateInput!, $where: ImageWhereUniqueInput!){
      rebuildImage (data: $data, where: $where) { ${customImageFields} }
    }`, {
      data,
      where
    });

    expect(mutation.rebuildImage).to.be.eql({
      id: this.currentImage.id,
      name: this.currentImage.name,
      imageSpec: {
        baseImage: this.currentImage.imageSpec.baseImage,
        packages: {
          apt: ['curl', 'vim'],
          pip: ['flask'],
          conda: []
        },
        cancel: false,
        pullSecret: null
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${customImageFields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(queryOne.image).to.be.eql({
      id: this.currentImage.id,
      name: this.currentImage.name,
      imageSpec: {
        baseImage: this.currentImage.imageSpec.baseImage,
        packages: {
          apt: ['curl', 'vim'],
          pip: ['flask'],
          conda: []
        },
        cancel: false,
        pullSecret: null
      }
    });
    this.currentImage = queryOne.image;
  });

  it('cancel a custom image', async () => {
    const where = {
      id: this.currentImage.name
    };
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!){
      cancelImageBuild (where: $where) { ${customImageFields} }
    }`, {
      where
    });

    expect(mutation.cancelImageBuild).to.be.eql({
      id: this.currentImage.id,
      name: this.currentImage.name,
      imageSpec: {
        baseImage: this.currentImage.imageSpec.baseImage,
        packages: {
          apt: ['curl', 'vim'],
          pip: ['flask'],
          conda: []
        },
        cancel: true,
        pullSecret: null
      }
    });

    // get one
    const queryOne = await this.graphqlRequest(`
    query($where: ImageWhereUniqueInput!){
      image (where: $where) { ${customImageFields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(queryOne.image).to.be.eql({
      id: this.currentImage.id,
      name: this.currentImage.name,
      imageSpec: {
        baseImage: this.currentImage.imageSpec.baseImage,
        packages: {
          apt: ['curl', 'vim'],
          pip: ['flask'],
          conda: []
        },
        cancel: true,
        pullSecret: null
      }
    });
    this.currentImage = queryOne.image;
  });

  it('should delete custom image', async () => {
    const mutation = await this.graphqlRequest(`
    mutation($where: ImageWhereUniqueInput!){
      deleteImage (where: $where) { id }
    }`, {
      where: {id: this.currentImage.id}
    });

    // query
    const data = await this.graphqlRequest(`
    query ($where: ImageWhereUniqueInput!) {
      image (where: $where) { ${fields} }
    }`, {
      where: {id: this.currentImage.id}
    });

    expect(data.image).to.be.null;
  });
});
