import { Collection, ObjectId } from "mongodb"
import {  User, UserModel, Post, PostModel, Comment,CommentModel } from "./types.ts"
import * as bcrypt from "bcrypt";

type QueryUserArgs = {
    id: string;
  };
  
  type QueryPostArgs = {
    id: string;
  };
  
  type QueryCommentArgs = {
    id: string;
  };

  export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    posts?: string[];
    comments?: string[];
    likedPosts?: string[];
  }
  export interface UpdateUserInput {
    name: string
    email: string
    password: string
    posts: string[] 
    comments: string[]
    likedPosts: string[]
  }
  export interface CreatePostInput {
    content: string;
    author: string;
    comments: string[];
    likes: string[];
  }
  export interface UpdatePostInput {
    content: string;
    author: string;
    comments: string[];
    likes: string[];
  }
  export interface CreateCommentInput {
    text: string;
    author: string;
    post: string;
  }
  export interface UpdateCommentInput {
    text: string;
    author: string;
    post: string;
  }


type Context={
    UserCollection: Collection<UserModel>
    PostCollection: Collection<PostModel>
    CommentCollection: Collection<CommentModel>
}




export const resolvers = { 
    User:{
        id:(parent:UserModel)=>{
            return parent._id?.toString();
        },
        posts:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.posts;
            return await ctx.PostCollection.find({_id: {$in: ids}}).toArray();
            
        },
        comments:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.comments;
            return await ctx.CommentCollection.find({_id: {$in: ids}}).toArray(); 

        },
        likedPosts:async(parent:UserModel, _:unknown, ctx:Context)=>{
            const ids=parent.likedPosts;
            return await ctx.PostCollection.find({_id: {$in: ids}}).toArray();

        }
            
        
    },

    Post:{
        id:(parent:PostModel)=>{
            return parent._id?.toString();
        },
        author:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.author;
            return await ctx.UserCollection.findOne({ _id: ids });
        },
        comments:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.comments;
            return await ctx.CommentCollection.find({_id: {$in: ids}}).toArray();

        },
        likes:async(parent:PostModel, _:unknown, ctx:Context)=>{
            const ids=parent.likes;
            return await ctx.UserCollection.find({_id: {$in: ids}}).toArray();

        }
    },
    Comment: {
        id: (parent: CommentModel) => {
            return parent._id?.toString();
        },
        author: async (parent: CommentModel, _: unknown, ctx: Context) => {
            const id = parent.author;
            return await ctx.UserCollection.findOne({ _id: id });
        },
        post: async (parent: CommentModel, _: unknown, ctx: Context) => {
            const id = parent.post;
            return await ctx.PostCollection.findOne({ _id: id });
        }
    },
    Query: {
        users: async (_: unknown, __: unknown, ctx: Context): Promise<UserModel[]> => {
            return await ctx.UserCollection.find().toArray();
        },
        user: async (_: unknown, args: QueryUserArgs, ctx: Context): Promise<UserModel | null> => {
            return await ctx.UserCollection.findOne({ _id: new ObjectId(args.id) });
        },
        posts: async (_: unknown, __: unknown, ctx: Context): Promise<PostModel[]> => {
            return await ctx.PostCollection.find().toArray();
        },
        post: async (_: unknown, args: QueryPostArgs, ctx: Context): Promise<PostModel | null> => {
            return await ctx.PostCollection.findOne({ _id: new ObjectId(args.id) });
        },
        comments: async (_: unknown, __: unknown, ctx: Context): Promise<CommentModel[]> => {
            return await ctx.CommentCollection.find().toArray();
        },
        comment: async (_: unknown, args: QueryCommentArgs, ctx: Context): Promise<CommentModel | null> => {
            return await ctx.CommentCollection.findOne({ _id: new ObjectId(args.id) });
        }
    },
 

    Mutation:{
        createUser: async (
            _: unknown,
            args: { input: CreateUserInput },
            ctx: Context
          ): Promise<UserModel> => {
            const { name, email, password, posts = [], comments = [], likedPosts = [] } = args.input;
      
            const existsUser = await ctx.UserCollection.findOne({ email });
            if (existsUser) {
              throw new Error("User already exists");
            }
      
            
            const hashedPassword = await bcrypt.hash(password);
      
            const user = await ctx.UserCollection.insertOne({
              email,
              name,
              password: hashedPassword,
              posts: posts.map((postId) => new ObjectId(postId)),
              comments: comments.map((commentId) => new ObjectId(commentId)),
              likedPosts: likedPosts.map((likedPostId) => new ObjectId(likedPostId)),
            });
      
            return {
              _id: user.insertedId,
              email,
              name,
              password: hashedPassword, 
              posts:[],
              comments:[],
              likedPosts:[],
            };
          },


        updateUser: async (
            _: unknown,
            args: { id: string; input: UpdateUserInput },
            ctx: Context
        ): Promise<UserModel> => {
            const { id, input } = args;
        
            const userId = new ObjectId(id);
        
            const existingUser = await ctx.UserCollection.findOne({ _id: userId });
            if (!existingUser) {
                throw new Error("User not found");
            }
        
            const updateData = {
                name: input.name,
                email: input.email,
                password: input.password,
                posts: input.posts.map((postId) => new ObjectId(postId)),
                comments: input.comments.map((commentId) => new ObjectId(commentId)),
                likedPosts: input.likedPosts.map((likedPostId) => new ObjectId(likedPostId)),
            };
        
            const result = await ctx.UserCollection.updateOne(
                { _id: userId },
                { $set: updateData }
            );
        
            if (result.matchedCount === 0) {
                throw new Error("Failed to update the user. User not found.");
            }
        
            const updatedUser = await ctx.UserCollection.findOne({ _id: userId });
            if (!updatedUser) {
                throw new Error("Failed to retrieve updated user.");
            }
        
            return {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                password: updatedUser.password,
                posts: updatedUser.posts,
                comments: updatedUser.comments,
                likedPosts: updatedUser.likedPosts,
            };
        },
        

        deleteUser: async (
            _: unknown,
            args: { id: string },
            context: Context
        ): Promise<boolean> => {
            const id = args.id;
        
            if (!id || !ObjectId.isValid(id)) {
                throw new Error("Invalid ID format");
            }
        
            const user = await context.UserCollection.findOne({ _id: new ObjectId(id) });
        
            if (!user) {
                throw new Error("User not found");
            }
        
            const postIds = user.posts || [];
        
            await context.PostCollection.deleteMany({
                _id: { $in: postIds.map(postId => new ObjectId(postId)) }
            });
        
            const deleteResult = await context.UserCollection.deleteOne({ _id: new ObjectId(id) });
        
            if (deleteResult.deletedCount === 0) {
                return false;
            }
        
            return true;
        },

        createPost:async(
            _:unknown,
            args:{input : CreatePostInput},
            ctx: Context
        ): Promise<PostModel> => {
            const {content, author, comments=[], likes=[] } = args.input;

            const existsPost = await ctx.PostCollection.findOne({content});
            if(existsPost){
                throw new Error("Post exists");
            }

            const post = await ctx.PostCollection.insertOne({
                content,
                author: new ObjectId(author),
                comments: comments.map((commentId) => new ObjectId(commentId)),
                likes: likes.map((likeId) => new ObjectId(likeId)),
            });
        
            return {
                _id: post.insertedId,
                content,
                author: new ObjectId(author),

                comments: [],
                likes: [],
              };
        },

        updatePost: async (
            _: unknown,
            args: { id: string; input: UpdatePostInput },
            ctx: Context
        ): Promise<PostModel> => {
            const { id, input } = args;
        
            const postId = new ObjectId(id);
        
            const existingPost = await ctx.PostCollection.findOne({ _id: postId });
            if (!existingPost) {
                throw new Error("Post not found");
            }
        
            const updateData: Partial<PostModel> = {
                content: input.content,
                author: input.author ? new ObjectId(input.author) : existingPost.author,
                comments: input.comments
                  ? input.comments.map((commentId) => new ObjectId(commentId))
                  : existingPost.comments,
                likes: input.likes
                  ? input.likes.map((likeId) => new ObjectId(likeId))
                  : existingPost.likes,
              };
        
            const result = await ctx.PostCollection.updateOne(
                { _id: postId },
                { $set: updateData }
            );
        
            if (result.matchedCount === 0) {
                throw new Error("Failed to update the post. Post not found.");
            }
        
            const updatedPost = await ctx.PostCollection.findOne({ _id: postId });
            if (!updatedPost) {
                throw new Error("Failed to retrieve updated post.");
            }
        
            return {
                _id: updatedPost._id,
                content: updatedPost.content,
                author: updatedPost.author,
                comments: updatedPost.comments,
                likes: updatedPost.likes,
            };
        },

        deletePost: async (
            _: unknown,
            args: { id: string },
            context: Context
        ): Promise<boolean> => {
            const id = args.id;
        
            if (!id || !ObjectId.isValid(id)) {
                throw new Error("Invalid ID format");
            }

            const postId = new ObjectId(id);
                
            const post = await context.PostCollection.findOne({ _id: postId });
            if (!post) {
              throw new Error("Post not found");
            }
        
            const deleteResult = await context.PostCollection.deleteOne({ _id: postId });

            if (deleteResult.deletedCount === 0) {
                    throw new Error("Failed to delete the post");
            }
            return true;
        },








        createComment: async (
            _: unknown,
            args: { input: CreateCommentInput },
            ctx: Context
          ): Promise<CommentModel> => {
            const { text, author, post } = args.input;
          
            const existingUser = await ctx.UserCollection.findOne({ _id: new ObjectId(author) });
            if (!existingUser) {
              throw new Error("Author not found");
            }
          
            const existingPost = await ctx.PostCollection.findOne({ _id: new ObjectId(post) });
            if (!existingPost) {
              throw new Error("Post not found");
            }
          
            const comment = await ctx.CommentCollection.insertOne({
              text,
              author: new ObjectId(author),
              post: new ObjectId(post),
            });
          
            return {
              _id: comment.insertedId,
              text,
              author: new ObjectId(author),
              post: new ObjectId(post),
            };
          },
          


        updateComment: async (
            _: unknown,
            args: { id: string; input: { text: string; author: string; post: string } },
            ctx: Context
          ): Promise<CommentModel> => {
            const { id, input } = args;
          
            if (!ObjectId.isValid(id)) {
              throw new Error("Invalid ID format");
            }
          
            const commentId = new ObjectId(id);
          
            const existingComment = await ctx.CommentCollection.findOne({ _id: commentId });
            if (!existingComment) {
              throw new Error("Comment not found");
            }
          
            const existingUser = await ctx.UserCollection.findOne({ _id: new ObjectId(input.author) });
            if (!existingUser) {
              throw new Error("Author not found");
            }
          
            const existingPost = await ctx.PostCollection.findOne({ _id: new ObjectId(input.post) });
            if (!existingPost) {
              throw new Error("Post not found");
            }
          
            const updateData = {
              text: input.text,
              author: new ObjectId(input.author),
              post: new ObjectId(input.post),
            };
          
            const result = await ctx.CommentCollection.updateOne(
              { _id: commentId },
              { $set: updateData }
            );
          
            if (result.matchedCount === 0) {
              throw new Error("Failed to update the comment. Comment not found.");
            }
          
            const updatedComment = await ctx.CommentCollection.findOne({ _id: commentId });
            if (!updatedComment) {
              throw new Error("Failed to retrieve updated comment.");
            }
          
            return {
              _id: updatedComment._id,
              text: updatedComment.text,
              author: updatedComment.author,
              post: updatedComment.post,
            };
        },

        deleteComment: async (
            _: unknown,
            args: { id: string },
            context: Context
          ): Promise<boolean> => {
            const { id } = args;
          
            if (!id || !ObjectId.isValid(id)) {
              throw new Error("Invalid ID format");
            }
          
            const commentId = new ObjectId(id);
          
            const comment = await context.CommentCollection.findOne({ _id: commentId });
          
            if (!comment) {
              throw new Error("Comment not found");
            }
          
            const deleteResult = await context.CommentCollection.deleteOne({ _id: commentId });
          
            if (deleteResult.deletedCount === 0) {
              throw new Error("Failed to delete the comment.");
            }
          
            await context.PostCollection.updateOne(
              { _id: comment.post },
              { $pull: { comments: commentId } }
            );
          
            await context.UserCollection.updateOne(
              { _id: comment.author },
              { $pull: { comments: commentId } }
            );
          
            return true;
        },     
    }
};