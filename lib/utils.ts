// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }


import { type ClassValue, clsx } from "clsx";
import { isValid } from "date-fns"
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// import { da } from "date-fns/locale"

//inv code
export function generateInviteCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ''
    for (let i = 0; i < 8; i++) { 
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}


// format date
export function formatDate(date: string | Date) {
    const d = new Date(date)
    return d.toLocaleDateString('id-ID', {
        day: "numeric",
        month: "short",
        year:  "numeric",
    })
}


//format date time

export function formatDateTime(date: string | Date) {
    const d = new Date(date)
    return d.toLocaleDateString('id-ID', {
        day: "numeric",
        month: "short",
        year:  "numeric",
        hour: "2-digit",
        minute: "2-digit",
        
    })
}

// cek dl

export function isOverdue(deadline: string | Date): boolean{ 
    return new Date(deadline) < new Date()
}

// waktu sebelum dl

export function getDaysUntil(deadline: string | Date): number {
    const now = new Date()
    const target = new Date(deadline)
    const diff = target.getTime() - now.getTime()
    
    return Math.ceil(diff/ (1000 * 60 * 60 * 24))
}

// ambil initsial nama

export function getInitials(name: string) {
    return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    
}

//validasi email

export function isvalidEmail(email: string):boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// validasi pass

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Harus ada huruf besar');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Harus ada huruf kecil');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Harus ada angka');
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    strength = password.length >= 12 ? 'strong' : 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}


//frormat besar file

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


export function validateImageFile(file: File): {
    isValid: boolean;
    error?: string;
}{
    const maxSize = 1024 * 1024 * 2;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Format file harus JPG, PNG, atau WebP'
        }
    }
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `Ukuran file maksimal 2MB (file kamu: ${formatFileSize(file.size)})`
        }
    }
    return {
        isValid: true
    }
}


// text sluggy

export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .replace(/[^\w\-]+/g, '')       // Hapus karakter non-word
        .replace(/\s+/g, '-')           // Ganti spasi dengan -
        .replace(/-+/g, '-')        // Ganti multiple - dengan single -
        .trim();
}