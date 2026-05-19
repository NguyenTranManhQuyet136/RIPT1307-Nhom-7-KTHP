export interface TagType {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  author_is_verified?: boolean;
  tags: TagType[];
  comment_count: number;
  view_count: number;
  score: number;
  is_edited?: boolean;
  created_at: string;
}
