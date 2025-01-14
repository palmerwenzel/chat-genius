import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { MessageService } from '@/services/messages';

/**
 * GET /api/messages/[id]
 * Get a message by its ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const messageService = new MessageService(supabase);

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message by ID
    const message = await messageService.getMessageById(params.id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error fetching message:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/messages/[id]
 * Update a message's content
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const messageService = new MessageService(supabase);

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get update data
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate update data
    const { content } = body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 });
    }

    // Verify message ownership
    const message = await messageService.getMessageById(params.id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (message.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this message' }, { status: 403 });
    }

    // Update message
    const updatedMessage = await messageService.updateMessage(params.id, {
      content: content.trim()
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (error) {
    console.error('Error updating message:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/messages/[id]
 * Delete a message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const messageService = new MessageService(supabase);

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify message ownership
    const message = await messageService.getMessageById(params.id);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (message.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    }

    // Delete message
    await messageService.deleteMessage(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 