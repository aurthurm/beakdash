import { useQuery, useMutation } from "@tanstack/react-query";
import { Space, InsertSpace } from "@/lib/db/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { create } from "zustand";
import { useAuth } from "@/lib/hooks/use-auth";

// Spaces store to maintain the currently selected space
interface SpaceStore {
  currentSpaceId: number | null;
  setCurrentSpaceId: (id: number | null) => void;
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  currentSpaceId: null, // Default to "All Spaces"
  setCurrentSpaceId: (id) => set({ currentSpaceId: id }),
}));

/**
 * Hook for spaces-related operations
 */
export function useSpaces() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentSpaceId, setCurrentSpaceId } = useSpaceStore();
  const [switchingSpace, setSwitchingSpace] = useState(false);
  const [userSettingsLoaded, setUserSettingsLoaded] = useState(false);

  // Fetch all available spaces
  const { 
    data: spaces = [], 
    isLoading: isLoadingSpaces, 
    error: spacesError
  } = useQuery<Space[]>({
    queryKey: ['/api/spaces'],
    queryFn: async () => {
      const response = await fetch('/api/spaces');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch spaces');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000 // 1 minute
  });

  // Handle spaces error separately
  useEffect(() => {
    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      toast({
        title: 'Error fetching spaces',
        description: spacesError.message,
        variant: 'destructive',
      });
    }
  }, [spacesError, toast]);

  // Fetch user's spaces
  const { 
    data: userSpaces = [], 
    isLoading: isLoadingUserSpaces,
    error: userSpacesError
  } = useQuery<Space[]>({
    queryKey: ['/api/spaces/user', user?.id],
    queryFn: async () => {
      if (!user || !user.id) {
        return [];
      }
      const response = await fetch(`/api/spaces/user?userId=${user.id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch user spaces');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 60000, // 1 minute
    enabled: !!user?.id // Only run the query if we have a user ID
  });
  
  // Handle user spaces error separately
  useEffect(() => {
    if (userSpacesError) {
      console.error('Error fetching user spaces:', userSpacesError);
      toast({
        title: 'Error fetching your spaces',
        description: userSpacesError.message,
        variant: 'destructive',
      });
    }
  }, [userSpacesError, toast]);
  
  // Load space ID from URL query parameters or user settings
  useEffect(() => {
    if (userSettingsLoaded) return;

    // Check URL for space ID parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const spaceIdParam = urlParams.get('spaceId');
    
    if (spaceIdParam) {
      // If URL has spaceId param, use that
      const parsedSpaceId = parseInt(spaceIdParam, 10);
      if (!isNaN(parsedSpaceId)) {
        setCurrentSpaceId(parsedSpaceId);
        setUserSettingsLoaded(true);
        return;
      }
    }
    
    // If no URL param and user is logged in, load from settings
    if (user && user.id) {
      const loadUserSettings = async () => {
        try {
          const response = await fetch(`/api/user/settings/${user.id}`);
          if (response.ok) {
            const settings = await response.json();
            // If user has a default space preference, set it
            if (settings && settings.defaultSpaceId !== undefined) {
              if (settings.defaultSpaceId === null) {
                // If default is explicitly set to null, use "All Spaces"
                setCurrentSpaceId(null);
              } else if (settings.defaultSpaceId) {
                // Otherwise use the specified space
                setCurrentSpaceId(Number(settings.defaultSpaceId));
              }
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        } finally {
          setUserSettingsLoaded(true);
        }
      };
      
      loadUserSettings();
    } else {
      // If not logged in and no URL param, just mark as loaded
      setUserSettingsLoaded(true);
    }
  }, [user, setCurrentSpaceId, userSettingsLoaded]);

  // Create a new space
  const createSpaceMutation = useMutation({
    mutationFn: async (spaceData: Omit<InsertSpace, 'slug'>) => {
      if (!user || !user.id) {
        throw new Error("You must be logged in to create a space");
      }
      
      // Generate slug from name
      const slug = spaceData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...spaceData,
          slug,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create space');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spaces/user'] });
      toast({
        title: "Space created",
        description: "Your new space has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create space",
        description: error.message || "An error occurred while creating the space.",
        variant: "destructive",
      });
    },
  });

  // Join a space
  const joinSpaceMutation = useMutation({
    mutationFn: async (spaceId: number) => {
      if (!user || !user.id) {
        throw new Error("You must be logged in to join a space");
      }
      const response = await apiRequest("POST", `/api/spaces/${spaceId}/join`, {
        userId: user.id,
        role: "member"
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces/user'] });
      toast({
        title: "Space joined",
        description: "You have joined the space successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join space",
        description: error.message || "An error occurred while joining the space.",
        variant: "destructive",
      });
    },
  });

  // Leave a space
  const leaveSpaceMutation = useMutation({
    mutationFn: async (spaceId: number) => {
      if (!user || !user.id) {
        throw new Error("You must be logged in to leave a space");
      }
      const response = await apiRequest("POST", `/api/spaces/${spaceId}/leave`, {
        userId: user.id
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces/user'] });
      toast({
        title: "Space left",
        description: "You have left the space successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave space",
        description: error.message || "An error occurred while leaving the space.",
        variant: "destructive",
      });
    },
  });

  // Switch to a different space
  const switchToSpace = async (spaceId: number) => {
    try {
      setSwitchingSpace(true);
      setCurrentSpaceId(spaceId);
      
      // Update URL with new space ID
      const url = new URL(window.location.href);
      url.searchParams.set('spaceId', spaceId.toString());
      window.history.pushState({}, '', url.toString());
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
      
      toast({
        title: "Space switched",
        description: "You have switched to a different space.",
      });
    } catch (error) {
      console.error('Error switching space:', error);
      toast({
        title: "Failed to switch space",
        description: error instanceof Error ? error.message : "An error occurred while switching spaces.",
        variant: "destructive",
      });
    } finally {
      setSwitchingSpace(false);
    }
  };
  
  // Get current space
  const currentSpace = Array.isArray(spaces) && spaces.length > 0 && currentSpaceId
    ? spaces.find(space => space && space.id === currentSpaceId) || null
    : null;

  // Update default space in user settings
  const updateDefaultSpace = useMutation({
    mutationFn: async (spaceId: number | null) => {
      if (!user || !user.id) {
        throw new Error("You must be logged in to update settings");
      }
      return apiRequest("PUT", `/api/user/settings/${user.id}`, {
        defaultSpaceId: spaceId
      });
    },
    onSuccess: (_, defaultSpaceId) => {
      toast({
        title: "Default space updated",
        description: defaultSpaceId === null 
          ? "All Spaces will now be selected by default" 
          : "Your default space preference has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update default space",
        description: error.message || "An error occurred while updating your settings.",
        variant: "destructive",
      });
    },
  });

  return {
    spaces,
    userSpaces, 
    isLoadingSpaces,
    isLoadingUserSpaces,
    spacesError,
    userSpacesError,
    createSpaceMutation,
    joinSpaceMutation,
    leaveSpaceMutation,
    updateDefaultSpace: updateDefaultSpace.mutate,
    currentSpaceId,
    currentSpace,
    setCurrentSpaceId,
    deselectCurrentSpace: () => setCurrentSpaceId(null),
    switchToSpace,
    switchingSpace
  };
}