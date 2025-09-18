import { Novu } from '@novu/api';
import type { Task, User } from '@prisma/client';

import { env } from '../../utils/env';

export async function createNovuTask({
  user,
  task,
  message,
  title,
  taskRootPath,
}: {
  user: Pick<User, 'id' | 'name' | 'email'>;
  task: Pick<Task, 'id' | 'title'>;
  title?: string;
  message?: string;
  taskRootPath: string;
}) {
  const novu = new Novu({ secretKey: env('NOVU_SECRET_KEY') });
  const publicUrl = env('NEXT_PUBLIC_WEBAPP_URL');
  await novu.trigger({
    to: {
      subscriberId: user.id.toString(),
      firstName: user.name || '',
      email: user.email,
    },
    workflowId: 'task-assigned',
    payload: {
      taskId: task.id,
      title: title,
      message: message,
      url: `${publicUrl}` + taskRootPath,
    },
  });
}
