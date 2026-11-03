# 08 – Frontend Implementation Guide

## Folder structure
```
client/src/
├── main.jsx
├── App.jsx                    # routes
├── api/
│   ├── client.js              # axios instance + refresh interceptor
│   └── hooks/                 # useJobs, useApplications, useStageMutation...
├── auth/                      # AuthContext, ProtectedRoute
├── components/
│   ├── ui/                    # Button, Input, Modal, Badge
│   ├── jobs/                  # JobCard, JobFilters
│   ├── kanban/                # Board, Column, CandidateCard
│   └── timeline/              # ApplicationTimeline
├── pages/
│   ├── public/                # Home, JobSearch, JobDetail
│   ├── auth/                  # Login, Register
│   ├── applicant/             # Dashboard, Profile, ApplicationDetail
│   └── recruiter/             # Jobs, JobForm, Board, CandidateDrawer
└── lib/                       # constants, formatters
```

## Routes
| Path | Access |
|---|---|
| `/` , `/jobs`, `/jobs/:id` | public |
| `/login`, `/register` | guest |
| `/me/applications`, `/me/applications/:id`, `/me/profile` | applicant |
| `/recruiter/jobs`, `/recruiter/jobs/new`, `/recruiter/jobs/:id/board` | recruiter |

## Axios client with silent refresh
```js
import axios from 'axios';

let accessToken = null;                       // kept in memory, not localStorage
export const setAccessToken = (t) => { accessToken = t; };

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true });

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      refreshing ??= api.post('/auth/refresh').finally(() => { refreshing = null; });
      const { data } = await refreshing;
      setAccessToken(data.data.accessToken);
      return api(original);
    }
    throw err;
  }
);
```
On app load call `/auth/refresh` once to restore the session from the cookie.

## Stage constants
```js
export const STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'offered', label: 'Offered' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' }
];
```

## Kanban board (`@hello-pangea/dnd`)
> `react-beautiful-dnd` is deprecated and does not officially support recent React versions. `@hello-pangea/dnd` is a drop-in fork: just change the import path.

```jsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { STAGES } from '../../lib/constants';

export default function Board({ jobId, columns }) {   // columns: { applied: [...], reviewing: [...] }
  const qc = useQueryClient();
  const key = ['board', jobId];

  const move = useMutation({
    mutationFn: ({ id, stage, beforeId, afterId }) =>
      api.patch(`/applications/${id}/stage`, { stage, beforeId, afterId }),
    onMutate: async ({ id, from, to, index }) => {          // optimistic update
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => {
        const next = structuredClone(old);
        const [card] = next[from].splice(next[from].findIndex((c) => c.id === id), 1);
        card.stage = to;
        next[to].splice(index, 0, card);
        return next;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx.prev),   // rollback
    onSettled: () => qc.invalidateQueries({ queryKey: key })
  });

  function onDragEnd({ source, destination, draggableId }) {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const to = destination.droppableId;
    const list = columns[to].filter((c) => c.id !== draggableId);
    move.mutate({
      id: draggableId, from: source.droppableId, to, index: destination.index,
      stage: to,
      beforeId: list[destination.index - 1]?.id,   // card above
      afterId: list[destination.index]?.id         // card below
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {STAGES.map((s) => (
          <Droppable droppableId={s.id} key={s.id}>
            {(p, snap) => (
              <section ref={p.innerRef} {...p.droppableProps}
                className={`w-72 shrink-0 rounded-lg p-3 ${snap.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'}`}>
                <h3 className="mb-2 font-semibold">{s.label} ({columns[s.id]?.length ?? 0})</h3>
                {(columns[s.id] ?? []).map((c, i) => (
                  <Draggable draggableId={c.id} index={i} key={c.id}>
                    {(dp) => (
                      <article ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}
                        className="mb-2 rounded bg-white p-3 shadow">
                        <p className="font-medium">{c.applicantName}</p>
                        <p className="text-xs text-gray-500">{c.headline}</p>
                      </article>
                    )}
                  </Draggable>
                ))}
                {p.placeholder}
              </section>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
```
**Accessibility:** the library supports keyboard dragging (space, arrows), but also add a "Move to…" menu on each card for screen readers and touch users.

**Rejection and offers:** open a small modal on drop into `rejected` or `offered` asking for an optional message, then send it as `message`.

## Applicant timeline
```jsx
const LABELS = { applied: 'Application sent', reviewing: 'Under review', interviewing: 'Interview stage',
                 offered: 'Offer made', hired: 'Hired', rejected: 'Not selected', withdrawn: 'Withdrawn' };

export default function ApplicationTimeline({ timeline }) {
  return (
    <ol className="relative border-l border-gray-300 pl-6">
      {timeline.map((t, i) => (
        <li key={i} className="mb-6">
          <span className={`absolute -left-1.5 h-3 w-3 rounded-full ${i === timeline.length - 1 ? 'bg-blue-600' : 'bg-gray-400'}`} />
          <p className="font-medium">{LABELS[t.stage]}</p>
          <time className="text-xs text-gray-500">{new Date(t.at).toLocaleString()}</time>
          {t.message && <p className="mt-1 rounded bg-gray-50 p-2 text-sm">{t.message}</p>}
        </li>
      ))}
    </ol>
  );
}
```

## Live updates without WebSockets
```js
export const useApplication = (id) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`).then((r) => r.data.data),
    refetchInterval: 30_000,          // poll every 30s
    refetchOnWindowFocus: true
  });
```
Upgrade later to Server-Sent Events (`EventSource`) or Socket.IO.

## Forms
Use `react-hook-form` and reuse the Zod schemas (copy into `client/src/lib/schemas.js`, or share through a workspace package later).

## UX checklist
- Empty states with guidance ("No applications yet. Browse jobs").
- Skeleton loaders for lists.
- Toasts for success and failure of mutations.
- Confirmation before withdrawing or rejecting.
- Show "Last updated 2 days ago" on every application row to counter ghosting.
