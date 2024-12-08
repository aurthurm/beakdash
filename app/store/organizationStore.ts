// interface Organization {
//     id: string;
//     name: string;
//     metadata?: Record<string, any>;
//   }
  
//   interface OrganizationMember {
//     user_id: string;
//     organization_id: string;
//     role: 'admin' | 'editor' | 'viewer';
//   }
  
//   interface OrganizationState {
//     organizations: Organization[];
//     currentOrganization: Organization | null;
//     members: OrganizationMember[];
//     loading: Record<string, boolean>;
//     error: Record<string, string | null>;
    
//     fetchOrganizations: () => Promise<void>;
//     fetchOrganization: (id: string) => Promise<void>;
//     createOrganization: (data: Omit<Organization, 'id'>) => Promise<void>;
//     updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
//     deleteOrganization: (id: string) => Promise<void>;
//     setCurrentOrganization: (id: string) => Promise<void>;
    
//     fetchMembers: (organizationId: string) => Promise<void>;
//     addMember: (organizationId: string, email: string, role: 'admin' | 'editor' | 'viewer') => Promise<void>;
//     updateMemberRole: (organizationId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => Promise<void>;
//     removeMember: (organizationId: string, userId: string) => Promise<void>;
    
//     clearError: (key: string) => void;
//   }
  
//   export const useOrganizationStore = create<OrganizationState>()(
//     devtools((set, get) => ({
//       organizations: [],
//       currentOrganization: null,
//       members: [],
//       loading: {},
//       error: {},
  
//       fetchOrganizations: async () => {
//         set(state => ({ loading: { ...state.loading, list: true } }));
//         try {
//           const response = await fetch('/api/organizations');
//           if (!response.ok) throw new Error('Failed to fetch organizations');
//           const data = await response.json();
//           set({ 
//             organizations: data,
//             loading: { ...get().loading, list: false }
//           });
//         } catch (error) {
//           set(state => ({ 
//             error: { 
//               ...state.error,
//               list: error instanceof Error ? error.message : 'Unknown error'
//             },
//             loading: { ...state.loading, list: false }
//           }));
//         }
//       },
  
//       fetchOrganization: async (id) => {
//         set(state => ({ loading: { ...state.loading, [id]: true } }));
//         try {
//           const response = await fetch(`/api/organizations/${id}`);
//           if (!response.ok) throw new Error('Failed to fetch organization');
//           const data = await response.json();
//           set(state => ({
//             organizations: [
//               ...state.organizations.filter(org => org.id !== id),
//               data
//             ],
//             loading: { ...state.loading, [id]: false }
//           }));
//         } catch (error) {
//           set(state => ({
//             error: { 
//               ...state.error,
//               [id]: error instanceof Error ? error.message : 'Unknown error'
//             },
//             loading: { ...state.loading, [id]: false }
//           }));
//         }
//       },
  
//       createOrganization: async (data) => {
//         set(state => ({ loading: { ...state.loading, create: true } }));
//         try {
//           const response = await fetch('/api/organizations', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//           });
//           if (!response.ok) throw new Error('Failed to create organization');
//           const newOrg = await response.json();
//           set(state => ({
//             organizations: [...state.organizations, newOrg],
//             loading: { ...state.loading, create: false }
//           }));
//         } catch (error) {
//           set(state => ({
//             error: { 
//               ...state.error,
//               create: error instanceof Error ? error.message : 'Unknown error'
//             },
//             loading: { ...state.loading, create: false }
//           }));
//         }
//       },
  
//       setCurrentOrganization: async (id) => {
//         const org = get().organizations.find(o => o.id === id);
//         if (org) {
//           set({ currentOrganization: org });
//           // Optionally persist the selection
//           localStorage.setItem('currentOrganizationId', id);
//         }
//       },
  
//       fetchMembers: async (organizationId) => {
//         set(state => ({ loading: { ...state.loading, members: true } }));
//         try {
//           const response = await fetch(`/api/organizations/${organizationId}/members`);
//           if (!response.ok) throw new Error('Failed to fetch members');
//           const data = await response.json();
//           set({ 
//             members: data,
//             loading: { ...get().loading, members: false }
//           });
//         } catch (error) {
//           set(state => ({
//             error: { 
//               ...state.error,
//               members: error instanceof Error ? error.message : 'Unknown error'
//             },
//             loading: { ...state.loading, members: false }
//           }));
//         }
//       },
  
//       addMember: async (organizationId, email, role) => {
//         set(state => ({ loading: { ...state.loading, addMember: true } }));
//         try {
//           const response = await fetch(`/api/organizations/${organizationId}/members`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ email, role }),
//           });
//           if (!response.ok) throw new Error('Failed to add member');
//           const newMember = await response.json();
//           set(state => ({
//             members: [...state.members, newMember],
//             loading: { ...state.loading, addMember: false }
//           }));
//         } catch (error) {
//           set(state => ({
//             error: { 
//               ...state.error,
//               addMember: error instanceof Error ? error.message : 'Unknown error'
//             },
//             loading: { ...state.loading, addMember: false }
//           }));
//         }
//       },
  
//       clearError: (key) => set(state => ({
//         error: { ...state.error, [key]: null }
//       }))
//     }))
//   );