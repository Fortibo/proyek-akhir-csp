export type UserRole = "admin" | "member"
 
export type TaskStatus = 'pending' | 'completed' | 'verified'

export type TaskRequestStatus = 'pending' | 'approved' | 'rejected'


export interface HouseGroup{
    id: string,
    name: string,
    invite_code: string,
    created_by: string | null,
    created_at: string,
}

export interface User{
    id: string,
    full_name: string,
    email: string,
    avatar_url: string | null,
    house_group_id: string |null,
    role: UserRole,
    created_at: string,
    // updated_at: string,
}

export interface Task{
    id: string,
    house_group_id: string,
    title: string,
    description: string | null,
    assigned_to: string | null,
    created_by: string | null,
    deadline: string, 
    status: TaskStatus,
    proof_image_url: string | null,
    created_at: string,
    updated_at: string,

    assigned_user?: User,
    creator?: User,
}

export interface TaskRequest{
    id: string,
    house_group_id: string,
    requested_by : string,
    title: string,
    description: string | null,
    status: TaskRequestStatus,
    rejection_reason: string | null,
    created_at: string,
    reviewed_at: string | null,
    reviewed_by: string | null,


    requester?: User,
    reviewer?: User,
}

export interface UserWithStats extends User{
    house_group?: HouseGroup,
    stats?: {
        total_tasks: number,
        completed_tasks: number,
        verified_tasks: number,
    }
}


export interface ApiResponse<T = any>{
    success: boolean,
    data?: T,
    error?: string,
    message?: string
}

export interface AuthResponse{
    success: boolean,
    user?: User,    
    error?: string,
}

export interface PaginationParams{
    page?: number,
    limit?: number,
    sortBy?: string,
    order?: 'asc' | 'desc',
}


export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  action: 'create' | 'join';
  group_name?: string;
  invite_code?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  assigned_to: string;
  deadline: string;
}

export interface TaskRequestFormData {
  title: string;
  description?: string;
}

export interface ProfileUpdateData {
  full_name: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}