import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifySessionToken, UserSessionPayload } from '../lib/session.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: UserSessionPayload;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    } else if (req.cookies && req.cookies.session_token) {
      token = req.cookies.session_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    // Try custom session token first
    const session = verifySessionToken(token);
    if (session) {
      req.user = session;
      return next();
    }

    // If not custom session token, try Firebase ID token
    try {
      const decodedFirebaseToken = await adminAuth.verifyIdToken(token);
      // Fetch or link user in database
      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.uid, decodedFirebaseToken.uid))
        .limit(1);

      if (dbUsers.length > 0) {
        const u = dbUsers[0];
        req.user = {
          id: u.id,
          uid: u.uid,
          username: u.username,
          email: u.email,
          role: u.role,
          hospitalId: u.hospitalId,
          fullName: u.fullName,
          mustChangePassword: u.mustChangePassword,
        };
        return next();
      } else {
        // If not found yet, create as patient user
        const newEmail = decodedFirebaseToken.email || `${decodedFirebaseToken.uid}@patient.local`;
        const newName = decodedFirebaseToken.name || 'Patient';
        const inserted = await db
          .insert(users)
          .values({
            uid: decodedFirebaseToken.uid,
            username: (decodedFirebaseToken.email || decodedFirebaseToken.uid).split('@')[0],
            email: newEmail,
            passwordHash: 'FIREBASE_AUTH',
            role: 'PATIENT',
            fullName: newName,
            isEmailVerified: true,
            status: 'ACTIVE',
          })
          .returning();

        const u = inserted[0];
        req.user = {
          id: u.id,
          uid: u.uid,
          username: u.username,
          email: u.email,
          role: u.role,
          hospitalId: u.hospitalId,
          fullName: u.fullName,
          mustChangePassword: false,
        };
        return next();
      }
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] permissions.`,
      });
    }
    next();
  };
};

export const requireHospitalAccess = (
  extractHospitalId?: (req: AuthRequest) => number | undefined | null
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CENTRAL_ADMIN has network-wide access
    if (req.user.role === 'CENTRAL_ADMIN') {
      return next();
    }

    // Determine target hospital ID
    let targetHospitalId: number | undefined;
    if (extractHospitalId) {
      const extracted = extractHospitalId(req);
      if (extracted !== undefined && extracted !== null) {
        targetHospitalId = Number(extracted);
      }
    } else {
      const raw = req.params.hospitalId || req.query.hospitalId || req.body.hospitalId;
      if (raw) {
        targetHospitalId = Number(raw);
      }
    }

    // If targetHospitalId is specified and user is hospital staff, ensure it matches user's hospitalId
    if (targetHospitalId && req.user.hospitalId && req.user.hospitalId !== targetHospitalId) {
      return res.status(403).json({
        error: 'Tenant Isolation Error: You cannot access or modify records of another hospital.',
      });
    }

    next();
  };
};
