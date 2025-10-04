import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, get, set, push, runTransaction, query, orderByChild } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Post, Comment, User } from '@shared/schema';
import { Heart, MessageCircle, Image as ImageIcon, Send, User as UserIcon, Loader2, X, Search, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';

interface PostWithUser extends Post {
  user?: User;
}

interface CommentWithUser extends Comment {
  user?: User;
}

export default function Feed() {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, CommentWithUser[]>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'comments'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    loadLikedPosts();
  }, [userData]);

  const loadLikedPosts = async () => {
    if (!userData) return;
    
    try {
      const likesRef = dbRef(db, 'postLikes');
      const snapshot = await get(likesRef);
      
      if (!snapshot.exists()) {
        setLikedPosts(new Set());
        return;
      }

      const likesData = snapshot.val();
      const userLikedPosts = new Set<string>();
      
      Object.keys(likesData).forEach((key) => {
        if (key.startsWith(`${userData.id}_`)) {
          const postId = key.split('_')[1];
          userLikedPosts.add(postId);
        }
      });

      setLikedPosts(userLikedPosts);
    } catch (error) {
      console.error('Error loading liked posts:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const postsRef = dbRef(db, 'posts');
      const snapshot = await get(postsRef);
      
      if (!snapshot.exists()) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postsData = snapshot.val();
      const postsArray: PostWithUser[] = await Promise.all(
        Object.keys(postsData).map(async (key) => {
          const postData = postsData[key];
          const userSnapshot = await get(dbRef(db, `users/${postData.userId}`));
          let user: User | undefined;
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            user = {
              id: postData.userId,
              email: userData.email || 'unknown@example.com',
              createdAt: new Date(userData.createdAt),
              streak: userData.streak || 0,
              bestStreak: userData.bestStreak || 0,
              totalDays: userData.totalDays || 0,
              lastCompletedDate: userData.lastCompletedDate,
              likesGiven: userData.likesGiven || 0,
              country: userData.country,
              bio: userData.bio,
              profilePhoto: userData.profilePhoto,
              autoShareProgress: userData.autoShareProgress || false,
            };
          }

          return {
            id: key,
            userId: postData.userId,
            content: postData.content || '',
            imageUrl: postData.imageUrl,
            groupId: postData.groupId,
            likes: postData.likes || 0,
            commentCount: postData.commentCount || 0,
            createdAt: new Date(postData.createdAt),
            user,
          };
        })
      );

      postsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPosts(postsArray);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedImage) {
      toast({
        title: "Empty post",
        description: "Please add some content or an image to your post.",
        variant: "destructive",
      });
      return;
    }

    if (!userData || !currentUser) return;

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const imagePath = `posts/${userData.id}/${Date.now()}.jpg`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newPostRef = push(dbRef(db, 'posts'));
      const newPost: any = {
        userId: userData.id,
        content: postContent.trim(),
        likes: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      };

      if (imageUrl) {
        newPost.imageUrl = imageUrl;
      }

      await set(newPostRef, newPost);

      setPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Post created! 🎉",
        description: "Your post has been shared with the community.",
      });

      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (post: PostWithUser) => {
    if (!userData) return;

    const likeDocId = `${userData.id}_${post.id}`;
    const likeRef = dbRef(db, `postLikes/${likeDocId}`);
    const isCurrentlyLiked = likedPosts.has(post.id);

    const newLikedPosts = new Set(likedPosts);
    if (isCurrentlyLiked) {
      newLikedPosts.delete(post.id);
    } else {
      newLikedPosts.add(post.id);
    }
    setLikedPosts(newLikedPosts);

    setPosts(posts.map(p => 
      p.id === post.id 
        ? { ...p, likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));

    try {
      const likeResult = await runTransaction(likeRef, (currentLike) => {
        if (currentLike) {
          return null;
        } else {
          return {
            userId: userData.id,
            postId: post.id,
            createdAt: new Date().toISOString(),
          };
        }
      });

      if (!likeResult.committed) {
        setLikedPosts(likedPosts);
        return;
      }

      const isLiking = likeResult.snapshot.val() !== null;

      const postLikesRef = dbRef(db, `posts/${post.id}/likes`);
      await runTransaction(postLikesRef, (currentLikes) => {
        if (isLiking) {
          return (currentLikes || 0) + 1;
        } else {
          return Math.max(0, (currentLikes || 0) - 1);
        }
      });

      await loadPosts();
    } catch (error) {
      console.error('Error updating like:', error);
      setLikedPosts(likedPosts);
      setPosts(posts);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadComments = async (postId: string) => {
    setLoadingComments(prev => new Set(prev).add(postId));
    try {
      const commentsRef = dbRef(db, `comments/${postId}`);
      const snapshot = await get(commentsRef);
      
      if (!snapshot.exists()) {
        setPostComments(prev => ({ ...prev, [postId]: [] }));
        return;
      }

      const commentsData = snapshot.val();
      const commentsArray: CommentWithUser[] = await Promise.all(
        Object.keys(commentsData).map(async (key) => {
          const commentData = commentsData[key];
          const userSnapshot = await get(dbRef(db, `users/${commentData.userId}`));
          let user: User | undefined;
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            user = {
              id: commentData.userId,
              email: userData.email || 'unknown@example.com',
              createdAt: new Date(userData.createdAt),
              streak: userData.streak || 0,
              bestStreak: userData.bestStreak || 0,
              totalDays: userData.totalDays || 0,
              lastCompletedDate: userData.lastCompletedDate,
              likesGiven: userData.likesGiven || 0,
              country: userData.country,
              bio: userData.bio,
              profilePhoto: userData.profilePhoto,
              autoShareProgress: userData.autoShareProgress || false,
            };
          }

          return {
            id: key,
            postId: commentData.postId,
            userId: commentData.userId,
            content: commentData.content || '',
            createdAt: new Date(commentData.createdAt),
            user,
          };
        })
      );

      commentsArray.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setPostComments(prev => ({ ...prev, [postId]: commentsArray }));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const toggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!postComments[postId]) {
        await loadComments(postId);
      }
    }
    setExpandedComments(newExpanded);
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !userData) return;

    setCommentingOn(postId);
    try {
      const newCommentRef = push(dbRef(db, `comments/${postId}`));
      const newComment = {
        postId,
        userId: userData.id,
        content,
        createdAt: new Date().toISOString(),
      };

      await set(newCommentRef, newComment);

      const postCommentCountRef = dbRef(db, `posts/${postId}/commentCount`);
      await runTransaction(postCommentCountRef, (currentCount) => {
        return (currentCount || 0) + 1;
      });

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
      await loadPosts();

      toast({
        title: "Comment added!",
        description: "Your comment has been posted.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCommentingOn(null);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (email: string) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode) return null;
    const code = countryCode.toUpperCase();
    return String.fromCodePoint(...code.split('').map(c => 127397 + c.charCodeAt(0)));
  };

  const filteredPosts = posts
    .filter(post => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const content = post.content?.toLowerCase() || '';
        const authorName = post.user ? getDisplayName(post.user.email).toLowerCase() : '';
        const authorEmail = post.user?.email.toLowerCase() || '';
        return content.includes(query) || authorName.includes(query) || authorEmail.includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'popular':
          return b.likes - a.likes;
        case 'comments':
          return b.commentCount - a.commentCount;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Page Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Community Feed
          </h1>
          <p className="text-lg text-muted-foreground">Share your journey and connect with others</p>
        </div>

        {/* Create Post Form */}
        <Card className="animate-fade-in-up border-border/50 shadow-xl rounded-3xl overflow-hidden" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
                {userData.profilePhoto ? (
                  <img src={userData.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary-foreground">{getInitials(userData.email)}</span>
                )}
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="What's on your mind? Share your progress, thoughts, or encouragement..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[120px] resize-none border-border/50 focus:border-primary/50 transition-colors"
                  data-testid="input-post-content"
                />
              </div>
            </div>

            {imagePreview && (
              <div className="relative mb-4 rounded-xl overflow-hidden" data-testid="image-preview">
                <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-cover" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                  data-testid="button-remove-image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  data-testid="input-image-file"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="gap-2"
                  data-testid="button-upload-image"
                >
                  <ImageIcon className="w-4 h-4" />
                  {selectedImage ? 'Change Image' : 'Add Image'}
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={submitting || (!postContent.trim() && !selectedImage)}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-xl transition-all"
                data-testid="button-create-post"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Share Post'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="animate-fade-in-up space-y-4" style={{ animationDelay: '0.15s' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts by content or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-border/50 focus:border-primary/50"
                data-testid="input-search-posts"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              data-testid="button-toggle-post-filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-[140px] h-9 border-border/50" data-testid="select-sort-posts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Liked</SelectItem>
                        <SelectItem value="comments">Most Commented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredPosts.length} of {posts.length} posts
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {filteredPosts.length === 0 ? (
            <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
                <h3 className="text-2xl font-bold mb-3" data-testid="text-no-posts">No Posts Yet</h3>
                <p className="text-muted-foreground text-lg">Be the first to share something with the community!</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden"
                data-testid={`card-post-${post.id}`}
              >
                <CardContent className="p-6 md:p-8">
                  {/* Post Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
                      {post.user?.profilePhoto ? (
                        <img src={post.user.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary-foreground" data-testid={`text-user-initials-${post.id}`}>
                          {post.user ? getInitials(post.user.email) : <UserIcon className="w-6 h-6" />}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg" data-testid={`text-post-author-${post.id}`}>
                          {post.user ? getDisplayName(post.user.email) : 'Unknown User'}
                        </h3>
                        {post.user?.country && (
                          <span className="text-lg" data-testid={`text-user-country-${post.id}`}>
                            {getFlagEmoji(post.user.country)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`text-post-time-${post.id}`}>
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <p className="text-base mb-4 whitespace-pre-wrap leading-relaxed" data-testid={`text-post-content-${post.id}`}>
                      {post.content}
                    </p>
                  )}

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden" data-testid={`img-post-${post.id}`}>
                      <img src={post.imageUrl} alt="Post" className="w-full max-h-[500px] object-cover" />
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePost(post)}
                      className={`gap-2 transition-colors ${
                        likedPosts.has(post.id) 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'hover:text-red-500'
                      }`}
                      data-testid={`button-like-${post.id}`}
                    >
                      <Heart 
                        className={`w-5 h-5 transition-all ${
                          likedPosts.has(post.id) ? 'fill-red-500' : ''
                        }`}
                      />
                      <span data-testid={`text-likes-${post.id}`}>{post.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                      className="gap-2 hover:text-primary transition-colors"
                      data-testid={`button-comments-${post.id}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span data-testid={`text-comment-count-${post.id}`}>{post.commentCount}</span>
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-6 pt-6 border-t border-border/50 space-y-4" data-testid={`section-comments-${post.id}`}>
                      {loadingComments.has(post.id) ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {postComments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3" data-testid={`comment-${comment.id}`}>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center shrink-0">
                                {comment.user?.profilePhoto ? (
                                  <img src={comment.user.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-primary-foreground">
                                    {comment.user ? getInitials(comment.user.email) : '?'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 bg-muted/50 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm" data-testid={`text-comment-author-${comment.id}`}>
                                    {comment.user ? getDisplayName(comment.user.email) : 'Unknown User'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                  </p>
                                </div>
                                <p className="text-sm" data-testid={`text-comment-content-${comment.id}`}>{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment Input */}
                          <div className="flex items-start gap-3 pt-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                              {userData.profilePhoto ? (
                                <img src={userData.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-primary-foreground">{getInitials(userData.email)}</span>
                              )}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="min-h-[60px] resize-none text-sm"
                                data-testid={`input-comment-${post.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim() || commentingOn === post.id}
                                className="shrink-0 h-[60px]"
                                data-testid={`button-add-comment-${post.id}`}
                              >
                                {commentingOn === post.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
