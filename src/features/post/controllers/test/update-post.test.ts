/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Server } from 'socket.io';
import { authUserPayload } from '@root/mocks/auth.mock';
import * as postServer from '@sockets/post';
import { postMockData, postMockRequest, postMockResponse, updatedPost, updatedPostWithImage } from '@root/mocks/post.mock';
import { PostCache } from '@services/redis/post.cache';
import { postQueue } from '@services/queues/post.queue';
import { UpdatePostController } from '@post/controllers/update-post';
import * as cloudinaryUploads from '@globals/helpers/cloudinary-uploads';
import { PostInput } from '@post/schemes/post';

jest.useFakeTimers();
jest.mock('@services/queues/base.queue');
jest.mock('@services/redis/post.cache');
jest.mock('@globals/helpers/cloudinary-uploads');

Object.defineProperties(postServer, {
  socketIOPostObject: {
    value: new Server(),
    writable: true
  }
});

describe('Update', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('posts', () => {
    it('should send correct json response', async () => {
      const req = postMockRequest(updatedPost, authUserPayload, { postId: `${postMockData._id}` }) as Request<
        { postId: string },
        unknown,
        PostInput
      >;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache').mockResolvedValue(postMockData);
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePostController.updatePost(req, res);
      expect(postSpy).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post updated successfully'
      });
    });
  });

  describe('postWithImage', () => {
    it('should send correct json response if imgId and imgVersion exists', async () => {
      updatedPostWithImage.imageId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request<
        { postId: string },
        unknown,
        PostInput
      >;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache');
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePostController.updatePostWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully'
      });
    });

    it('should send correct json response if no imgId and imgVersion', async () => {
      updatedPostWithImage.imageId = '1234';
      updatedPostWithImage.imgVersion = '1234';
      updatedPost.imgId = '1234';
      updatedPost.imgVersion = '1234';
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image = 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
      const req = postMockRequest(updatedPostWithImage, authUserPayload, { postId: `${postMockData._id}` }) as Request<
        { postId: string },
        unknown,
        PostInput
      >;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, 'updatePostInCache');
      jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any => Promise.resolve({ version: '1234', public_id: '123456' }));
      jest.spyOn(postServer.socketIOPostObject, 'emit');
      jest.spyOn(postQueue, 'addPostJob');

      await UpdatePostController.updatePostWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(`${postMockData._id}`, postSpy.mock.calls[0][1]);
      expect(postServer.socketIOPostObject.emit).toHaveBeenCalledWith('update post', postMockData, 'posts');
      expect(postQueue.addPostJob).toHaveBeenCalledWith('updatePostInDB', { key: `${postMockData._id}`, value: postMockData });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Post with image updated successfully'
      });
    });
  });
});
