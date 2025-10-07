import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { ref as dbRef, get, set, push, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/shared/lib/firebase';
import { Group, GroupMember, Post, Comment, User } from '@shared/schema';
import { Heart, MessageCircle, Image as ImageIcon, Send, User as UserIcon, Loader2, X, Users, LogOut, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRoute, Link } from 'wouter';

interface PostWithUser extends Post {
  user?: User;
}

interface CommentWithUser extends Comment {
  user?: User;
}

interface MemberWithUser extends GroupMember {
  user?: User;
}

export default function GroupDetail() {
  const [, params] = useRoute('/groups/:id');
  const groupId = params?.id;
  
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
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
  const [leavingGroup, setLeavingGroup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (groupId && userData) {
      loadGroupData();
    }
  }, [groupId, userData]);

  const loadGroupData = async () => {
    if (!groupId || !userData) return;

    try {
      const groupRef = dbRef(db, `groups/${groupId}`);
      const groupSnapshot = await get(groupRef);
      
      if (!groupSnapshot.exists()) {
        toast({
          title: "Group not found",
          description: "This group does not exist.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const groupData = groupSnapshot.val();
      setGroup({
        id: groupId,
        name: groupData.name,
        description: groupData.description,
        createdBy: groupData.createdBy,
        memberCount: groupData.memberCount || 0,
        imageUrl: groupData.imageUrl,
        createdAt: new Date(groupData.createdAt),
      });

      const membershipId = `${groupId}_${userData.id}`;
      const membershipRef = dbRef(db, `groupMembers/${membershipId}`);
      const membershipSnapshot = await get(membershipRef);
      setIsMember(membershipSnapshot.exists());

      await Promise.all([
        loadMembers(),
        loadPosts(),
        loadLikedPosts(),
      ]);
    } catch (error) {
      console.error('Error loading group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!groupId) return;

    try {
      const membersRef = dbRef(db, 'groupMembers');
      const snapshot = await get(membersRef);
      
      if (!snapshot.exists()) {
        setMembers([]);
        return;
      }

      const membersData = snapshot.val();
      const groupMembers: MemberWithUser[] = await Promise.all(
        Object.keys(membersData)
          .filter(key => key.startsWith(`${groupId}_`))
          .map(async (key) => {
            const memberData = membersData[key];
            const userSnapshot = await get(dbRef(db, `users/${memberData.userId}`));
            let user: User | undefined;
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              user = {
                id: memberData.userId,
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
              groupId: memberData.groupId,
              userId: memberData.userId,
              joinedAt: new Date(memberData.joinedAt),
              user,
            };
          })
      );

      groupMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

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
    if (!groupId) return;

    try {
      const postsRef = dbRef(db, 'posts');
      const snapshot = await get(postsRef);
      
      if (!snapshot.exists()) {
        setPosts([]);
        return;
      }

      const postsData = snapshot.val();
      const postsArray: PostWithUser[] = await Promise.all(
        Object.keys(postsData)
          .filter(key => postsData[key].groupId === groupId)
          .map(async (key) => {
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
    // Validate content
    if (!postContent.trim() && !selectedImage) {
      toast({
        title: "Empty post",
        description: "Please add some content or an image to your post.",
        variant: "destructive",
      });
      return;
    }

    // Validate content length
    if (postContent.trim().length > 5000) {
      toast({
        title: "Content too long",
        description: "Please keep your post under 5000 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!userData || !currentUser || !groupId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a post.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (selectedImage) {
        try {
          const imagePath = `posts/${userData.id}/${Date.now()}.jpg`;
          const imageRef = storageRef(storage, imagePath);
          await uploadBytes(imageRef, selectedImage);
          imageUrl = await getDownloadURL(imageRef);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: "Image Upload Failed",
            description: "Failed to upload image. Posting without image.",
            variant: "destructive",
          });
        }
      }

      // Create post with all required fields
      const newPostRef = push(dbRef(db, 'posts'));
      const newPost = {
        userId: userData.id,
        content: postContent.trim(),
        groupId,
        imageUrl: imageUrl || undefined,
        likes: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      };

      await set(newPostRef, newPost);

      // Reset form
      setPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Post created! 🎉",
        description: "Your post has been shared with the group.",
      });

      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleLeaveGroup = async () => {
    if (!userData || !groupId || !group) return;

    setLeavingGroup(true);
    try {
      const membershipId = `${groupId}_${userData.id}`;
      const membershipRef = dbRef(db, `groupMembers/${membershipId}`);
      
      await set(membershipRef, null);
      
      const groupMemberCountRef = dbRef(db, `groups/${groupId}/memberCount`);
      await runTransaction(groupMemberCountRef, (currentCount) => {
        return Math.max(0, (currentCount || 0) - 1);
      });

      toast({
        title: "Left group",
        description: `You have left ${group.name}.`,
      });

      setIsMember(false);
      await loadGroupData();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLeavingGroup(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group || !userData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        <div className="animate-fade-in-up">
          <Link href="/groups">
            <Button variant="ghost" className="mb-4 gap-2" data-testid="button-back-to-groups">
              <ArrowLeft className="w-4 h-4" />
              Back to Groups
            </Button>
          </Link>
        </div>

        <Card className="animate-fade-in-up border-border/50 shadow-xl rounded-3xl overflow-hidden" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-0">
            {group.imageUrl ? (
              <div className="h-64 overflow-hidden">
                <img 
                  src={group.imageUrl} 
                  alt={group.name} 
                  className="w-full h-full object-cover"
                  data-testid="img-group-header"
                />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <Users className="w-32 h-32 text-muted-foreground opacity-50" />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" data-testid="text-group-name">
                    {group.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4" data-testid="text-group-description">
                    {group.description}
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    <span data-testid="text-group-member-count">
                      {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                
                {isMember && (
                  <Button
                    variant="outline"
                    onClick={handleLeaveGroup}
                    disabled={leavingGroup}
                    className="gap-2"
                    data-testid="button-leave-group"
                  >
                    {leavingGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Leave Group
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {isMember && (
              <Card className="animate-fade-in-up border-border/50 shadow-xl rounded-3xl overflow-hidden" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold mb-4">Create Post</h2>
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
                        placeholder="Share something with the group..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="min-h-[100px] resize-none border-border/50 focus:border-primary/50 transition-colors"
                        data-testid="input-group-post-content"
                      />
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="relative mb-4 rounded-xl overflow-hidden" data-testid="image-preview-post">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-cover" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                        data-testid="button-remove-post-image"
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
                        data-testid="input-group-post-image-file"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                        className="gap-2"
                        data-testid="button-upload-post-image"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {selectedImage ? 'Change Image' : 'Add Image'}
                      </Button>
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={submitting || (!postContent.trim() && !selectedImage)}
                      className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-xl transition-all"
                      data-testid="button-create-group-post"
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
            )}

            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold">Group Posts</h2>
              
              {posts.length === 0 ? (
                <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
                    <h3 className="text-2xl font-bold mb-3" data-testid="text-no-group-posts">No Posts Yet</h3>
                    <p className="text-muted-foreground text-lg">
                      {isMember ? 'Be the first to share something with the group!' : 'Join the group to see posts and participate!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden"
                    data-testid={`card-group-post-${post.id}`}
                  >
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
                          {post.user?.profilePhoto ? (
                            <img src={post.user.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-primary-foreground" data-testid={`text-post-user-initials-${post.id}`}>
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
                              <span className="text-lg" data-testid={`text-post-user-country-${post.id}`}>
                                {getFlagEmoji(post.user.country)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`text-post-time-${post.id}`}>
                            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {post.content && (
                        <p className="text-base mb-4 whitespace-pre-wrap leading-relaxed" data-testid={`text-post-content-${post.id}`}>
                          {post.content}
                        </p>
                      )}

                      {post.imageUrl && (
                        <div className="mb-4 rounded-xl overflow-hidden" data-testid={`img-post-${post.id}`}>
                          <img src={post.imageUrl} alt="Post" className="w-full max-h-[500px] object-cover" />
                        </div>
                      )}

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
                          data-testid={`button-like-post-${post.id}`}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-all ${
                              likedPosts.has(post.id) ? 'fill-red-500' : ''
                            }`}
                          />
                          <span data-testid={`text-post-likes-${post.id}`}>{post.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="gap-2 hover:text-primary transition-colors"
                          data-testid={`button-comments-post-${post.id}`}
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span data-testid={`text-post-comment-count-${post.id}`}>{post.commentCount}</span>
                        </Button>
                      </div>

                      {expandedComments.has(post.id) && (
                        <div className="mt-6 pt-6 border-t border-border/50 space-y-4" data-testid={`section-comments-post-${post.id}`}>
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
                                        {comment.user ? getInitials(comment.user.email) : <UserIcon className="w-4 h-4" />}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 bg-muted rounded-2xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm" data-testid={`text-comment-author-${comment.id}`}>
                                        {comment.user ? getDisplayName(comment.user.email) : 'Unknown User'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm" data-testid={`text-comment-content-${comment.id}`}>{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {isMember && (
                                <div className="flex items-center gap-2 pt-2">
                                  <Input
                                    placeholder="Add a comment..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(post.id);
                                      }
                                    }}
                                    className="flex-1"
                                    data-testid={`input-comment-${post.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddComment(post.id)}
                                    disabled={!commentInputs[post.id]?.trim() || commentingOn === post.id}
                                    className="bg-gradient-to-r from-primary via-secondary to-accent"
                                    data-testid={`button-send-comment-${post.id}`}
                                  >
                                    {commentingOn === post.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              )}
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

          <div className="lg:col-span-1">
            <Card className="animate-fade-in-up border-border/50 shadow-xl rounded-3xl overflow-hidden sticky top-24" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({members.length})
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3" data-testid={`member-${member.userId}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center shrink-0">
                        {member.user?.profilePhoto ? (
                          <img src={member.user.profilePhoto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary-foreground" data-testid={`text-member-initials-${member.userId}`}>
                            {member.user ? getInitials(member.user.email) : <UserIcon className="w-5 h-5" />}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" data-testid={`text-member-name-${member.userId}`}>
                          {member.user ? getDisplayName(member.user.email) : 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(member.joinedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
