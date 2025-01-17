import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the group exists and is public
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('visibility')
      .eq('id', params.groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { message: 'Group not found' },
        { status: 404 }
      );
    }

    if (group.visibility === 'private') {
      return NextResponse.json(
        { message: 'Cannot join private group without invitation' },
        { status: 403 }
      );
    }

    // Check if the user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select()
      .eq('group_id', params.groupId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { message: 'Already a member of this group' },
        { status: 400 }
      );
    }

    // Add the user as a member
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: params.groupId,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      return NextResponse.json(
        { message: 'Failed to join group' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully joined group' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 