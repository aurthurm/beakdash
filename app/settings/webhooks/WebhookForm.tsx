// import { useState } from 'react';
// import { Plus, X } from 'lucide-react';

// const WebhookForm = ({ onSubmit, onCancel }) => {
//   const [url, setUrl] = useState('');
//   const [events, setEvents] = useState<WebhookEvent[]>([]);

//   const availableEvents: WebhookEvent[] = [
//     'api_key.created',
//     'api_key.deleted',
//     'api_key.expired',
//     'rate_limit.exceeded',
//     'security.suspicious_usage',
//     'security.multiple_failures',
//   ];

//   return (
//     <form onSubmit={(e) => {
//       e.preventDefault();
//       onSubmit({ url, events });
//     }}>
//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Webhook URL
//           </label>
//           <input
//             type="url"
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Events
//           </label>
//           <div className="space-y-2">
//             {availableEvents.map((event) => (
//               <label key={event} className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={events.includes(event)}
//                   onChange={(e) => {
//                     if (e.target.checked) {
//                       setEvents([...events, event]);
//                     } else {
//                       setEvents(events.filter(e => e !== event));
//                     }
//                   }}
//                   className="mr-2"
//                 />
//                 {event}
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="flex justify-end space-x-2">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 border rounded-lg"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-500 text-white rounded-lg"
//           >
//             Create Webhook
//           </button>
//         </div>
//       </div>
//     </form>
//   );
// };