import { ObjectId, OptionalId } from "mongodb";

// Modelos de base de datos
export type UserModel = OptionalId<{
    name: string;
    password: string;
    email: string;
    posts: ObjectId[];
    comments: ObjectId[];
    likedPosts: ObjectId[];
}>;

export type PostModel = OptionalId<{
    content: string;
    author: ObjectId;
    comments: ObjectId[];
    likes: ObjectId[];
}>;

export type CommentModel = OptionalId<{
    text: string;
    author: ObjectId;
    post: ObjectId;
}>;

// Tipos GraphQL
export type User = {
    id: string;
    name: string;
    password: string;
    email: string;
    posts: Post[];
    comments: Comment[];
    likedPosts: Post[];
};

export type Post = {
    id: string;
    content: string;
    author: User;
    comments: Comment[];
    likes: User[];
};

export type Comment = {
    id: string;
    text: string;
    author: User;
    post: Post;
};