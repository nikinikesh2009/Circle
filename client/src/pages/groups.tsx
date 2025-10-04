import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, get, set, push, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Group, GroupMember } from '@shared/schema';
import { Users, Plus, LogOut, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

interface GroupWithMembership extends Group {
  isMember: boolean;
}

export default function Groups() {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGroups();
  }, [userData]);

  const loadGroups = async () => {
    if (!userData) return;

    try {
      const groupsRef = dbRef(db, 'groups');
      const snapshot = await get(groupsRef);
      
      if (!snapshot.exists()) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupsData = snapshot.val();
      
      const membershipsRef = dbRef(db, 'groupMembers');
      const membershipsSnapshot = await get(membershipsRef);
      const userMemberships = new Set<string>();
      
      if (membershipsSnapshot.exists()) {
        const membershipsData = membershipsSnapshot.val();
        Object.keys(membershipsData).forEach((key) => {
          if (key.endsWith(`_${userData.id}`)) {
            const groupId = key.split('_')[0];
            userMemberships.add(groupId);
          }
        });
      }

      const groupsArray: GroupWithMembership[] = Object.keys(groupsData).map((key) => {
        const groupData = groupsData[key];
        return {
          id: key,
          name: groupData.name,
          description: groupData.description,
          createdBy: groupData.createdBy,
          memberCount: groupData.memberCount || 0,
          imageUrl: groupData.imageUrl,
          createdAt: new Date(groupData.createdAt),
          isMember: userMemberships.has(key),
        };
      });

      groupsArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setGroups(groupsArray);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups. Please try again.",
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

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both name and description for the group.",
        variant: "destructive",
      });
      return;
    }

    if (!userData || !currentUser) return;

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const imagePath = `groups/${Date.now()}.jpg`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newGroupRef = push(dbRef(db, 'groups'));
      const groupId = newGroupRef.key!;
      
      const newGroup: any = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        createdBy: userData.id,
        memberCount: 1,
        createdAt: new Date().toISOString(),
      };

      if (imageUrl) {
        newGroup.imageUrl = imageUrl;
      }

      await set(newGroupRef, newGroup);

      const membershipId = `${groupId}_${userData.id}`;
      await set(dbRef(db, `groupMembers/${membershipId}`), {
        groupId,
        userId: userData.id,
        joinedAt: new Date().toISOString(),
      });

      setGroupName('');
      setGroupDescription('');
      setSelectedImage(null);
      setImagePreview(null);
      setShowCreateForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Group created! 🎉",
        description: "Your group has been successfully created.",
      });

      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinLeaveGroup = async (group: GroupWithMembership) => {
    if (!userData) return;

    setJoiningGroup(group.id);
    try {
      const membershipId = `${group.id}_${userData.id}`;
      const membershipRef = dbRef(db, `groupMembers/${membershipId}`);
      
      if (group.isMember) {
        await set(membershipRef, null);
        
        const groupMemberCountRef = dbRef(db, `groups/${group.id}/memberCount`);
        await runTransaction(groupMemberCountRef, (currentCount) => {
          return Math.max(0, (currentCount || 0) - 1);
        });

        toast({
          title: "Left group",
          description: `You have left ${group.name}.`,
        });
      } else {
        await set(membershipRef, {
          groupId: group.id,
          userId: userData.id,
          joinedAt: new Date().toISOString(),
        });
        
        const groupMemberCountRef = dbRef(db, `groups/${group.id}/memberCount`);
        await runTransaction(groupMemberCountRef, (currentCount) => {
          return (currentCount || 0) + 1;
        });

        toast({
          title: "Joined group! 🎉",
          description: `You have joined ${group.name}.`,
        });
      }

      await loadGroups();
    } catch (error) {
      console.error('Error joining/leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to update membership. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningGroup(null);
    }
  };

  const filteredGroups = filter === 'my' 
    ? groups.filter(g => g.isMember)
    : groups;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        <div className="animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Groups
          </h1>
          <p className="text-lg text-muted-foreground">Join communities and connect with like-minded people</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gradient-to-r from-primary via-secondary to-accent' : ''}
              data-testid="button-filter-all"
            >
              All Groups
            </Button>
            <Button
              variant={filter === 'my' ? 'default' : 'outline'}
              onClick={() => setFilter('my')}
              className={filter === 'my' ? 'bg-gradient-to-r from-primary via-secondary to-accent' : ''}
              data-testid="button-filter-my"
            >
              My Groups
            </Button>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-xl transition-all"
            data-testid="button-toggle-create-form"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {showCreateForm && (
          <Card className="animate-fade-in-up border-border/50 shadow-xl rounded-3xl overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Group Name *</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="border-border/50 focus:border-primary/50"
                    data-testid="input-group-name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <Textarea
                    placeholder="Describe what this group is about..."
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="min-h-[100px] resize-none border-border/50 focus:border-primary/50"
                    data-testid="input-group-description"
                  />
                </div>

                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden" data-testid="image-preview-group">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2 rounded-full w-8 h-8 p-0"
                      data-testid="button-remove-group-image"
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
                      data-testid="input-group-image-file"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      className="gap-2"
                      data-testid="button-upload-group-image"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {selectedImage ? 'Change Image' : 'Add Image (Optional)'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setGroupName('');
                        setGroupDescription('');
                        removeImage();
                      }}
                      disabled={submitting}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={submitting || !groupName.trim() || !groupDescription.trim()}
                      className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-xl transition-all"
                      data-testid="button-submit-create-group"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Group'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredGroups.length === 0 ? (
          <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-12 text-center">
              <Users className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-bold mb-3" data-testid="text-no-groups">
                {filter === 'my' ? 'No Groups Joined Yet' : 'No Groups Available'}
              </h3>
              <p className="text-muted-foreground text-lg">
                {filter === 'my' 
                  ? 'Join a group to start connecting with others!' 
                  : 'Be the first to create a group!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {filteredGroups.map((group) => (
              <Card 
                key={group.id} 
                className="border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group"
                data-testid={`card-group-${group.id}`}
              >
                <CardContent className="p-0">
                  <Link href={`/groups/${group.id}`}>
                    <div className="cursor-pointer">
                      {group.imageUrl ? (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={group.imageUrl} 
                            alt={group.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            data-testid={`img-group-${group.id}`}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                          <Users className="w-20 h-20 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-6">
                    <Link href={`/groups/${group.id}`}>
                      <h3 className="text-xl font-bold mb-2 cursor-pointer hover:text-primary transition-colors" data-testid={`text-group-name-${group.id}`}>
                        {group.name}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground mb-4 line-clamp-2" data-testid={`text-group-description-${group.id}`}>
                      {group.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span data-testid={`text-member-count-${group.id}`}>
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      
                      <Button
                        variant={group.isMember ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleJoinLeaveGroup(group)}
                        disabled={joiningGroup === group.id}
                        className={!group.isMember ? 'bg-gradient-to-r from-primary via-secondary to-accent' : ''}
                        data-testid={`button-join-leave-${group.id}`}
                      >
                        {joiningGroup === group.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : group.isMember ? (
                          <>
                            <LogOut className="w-4 h-4 mr-1" />
                            Leave
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Join
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
