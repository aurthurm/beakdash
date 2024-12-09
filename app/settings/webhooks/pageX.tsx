// 'use client';
// import { useState, useEffect } from 'react';
// import { Plus, Trash2, RefreshCw } from 'lucide-react';

// export default function WebhooksPage() {
//   const [webhooks, setWebhooks] = useState([]);
//   const [showCreateModal, setShowCreateModal] = useState(false);

//   useEffect(() => {
//     fetchWebhooks();
//   }, []);

//   const fetchWebhooks = async () => {
//     const response = await fetch('/api/webhooks');
//     if (response.ok) {
//       const data = await response.json();
//       setWebhooks(data);
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold">Webhooks</h1>
//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
//         >
//           <Plus size={20} />
//           Add Webhook
//         </button>
//       </div>

//       <div className="bg-white rounded-lg shadow">
//         <table className="w-full">
//           <thead>
//             <tr className="border-b">
//               <th className="text-left p-4">URL</th>
//               <th className="text-left p-4">Events</th>
//               <th className="text-left p-4">Status</th>
//               <th className="text-left p-4">Last Success</th>
//               <th className="text-left p-4">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {webhooks.map((webhook) => (
//               <tr key={webhook.id} className="border-b">
//                 <td className="p-4">
//                   <code className="bg-gray-100 px-2 py-1 rounded">
//                     {webhook.url}
//                   </code>
//                 </td>
//                 <td className="p-4">
//                   <div className="flex flex-wrap gap-1">
//                     {webhook.events.map((event) => (
//                       <span
//                         key={event}
//                         className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
//                       >
//                         {event}
//                       </span>
//                     ))}
//                   </div>
//                 </td>
//                 <td className="p-4">
//                   <span className={`px-2 py-1 rounded ${
//                     webhook.isEnabled
//                       ? 'bg-green-100 text-green-800'
//                       : 'bg-red-100 text-red-800'
//                   }`}>
//                     {webhook.isEnabled ? 'Active' : 'Inactive'}
//                   </span>
//                 </td>
//                 <td className="p-4">
//                   {webhook.lastSuccess
//                     ? new Date(webhook.lastSuccess).toLocaleString()
//                     : 'Never'}
//                 </td>
//                 <td className="p-4">
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => deleteWebhook(webhook.id)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                     <button
//                       onClick={() => testWebhook(webhook.id)}
//                       className="text-gray-500 hover:text-gray-700"
//                     >
//                       <RefreshCw size={16} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {showCreateModal && (
//         <Modal onClose={() => setShowCreateModal(false)}>
//           <WebhookForm
//             onSubmit={async (data) => {
//               const response = await fetch('/api/webhooks', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(data),
//               });
              
//               if (response.ok) {
//                 fetchWebhooks();
//                 setShowCreateModal(false);
//               }
//             }}
//             onCancel={() => setShowCreateModal(false)}
//           />
//         </Modal>
//       )}
//     </div>
//   );
// }