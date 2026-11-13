import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ErrorCode,
  MAX_COVER_BYTES,
  type SessionItemResponse,
} from '@shuttle-connect/types';
import { ApiError, apiRequest } from '@/shared/api';
import { resizeImageForUpload } from '@/shared/lib';
import { sessionKeys } from '@/entities/session';

// Failures that never reach our API (decoding/resizing in the browser) are wrapped in the same
// error code the server uses for a rejected upload, so the global MutationCache handler shows
// one translated toast for every way an upload can fail.
function uploadFailed(message: string): ApiError {
  return new ApiError({
    code: ErrorCode.INVALID_COVER_UPLOAD,
    statusCode: 0,
    message,
  });
}

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

async function uploadCover(
  sessionId: string,
  file: File,
): Promise<SessionItemResponse> {
  const blob = await resizeImageForUpload(file).catch(() => {
    throw uploadFailed('Could not read this image');
  });
  if (blob.size > MAX_COVER_BYTES) {
    throw uploadFailed('Image is still too large after resizing');
  }

  // Sent straight to our own API, not to S3 directly -- see CLAUDE.md's cover-photo section for
  // why. FormData, not JSON: apiRequest lets the browser set Content-Type itself for this (it
  // needs to add the multipart boundary).
  const form = new FormData();
  form.append('file', blob, `cover.${EXTENSIONS[blob.type] ?? 'bin'}`);
  return apiRequest<SessionItemResponse>(`/sessions/${sessionId}/cover`, {
    method: 'PATCH',
    body: form,
  });
}

// features/upload-session-cover/api: resize, then one PATCH carrying the file. The response is
// the full updated session, so the detail cache is written directly; lists are only invalidated,
// since they hold SessionOverview items that also carry coverUrl now.
export function useUploadSessionCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      uploadCover(sessionId, file),
    onSuccess: async (session) => {
      queryClient.setQueryData(sessionKeys.detail(session.id), session);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
