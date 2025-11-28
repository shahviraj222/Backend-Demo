import { Router } from 'express'

import ProfilesApi from '../controllers/profilesController'
import middlewares from '../middlewares';

const router = Router()

router.get('/', middlewares.checkForUser, ProfilesApi.getProfiles);

router.get('/:id', middlewares.checkForUser, ProfilesApi.getProfile);

// Allow account creation WITHOUT login
router.post('/', ProfilesApi.createProfile);

// These should also require login (but you can decide)
router.put('/:id', middlewares.checkForUser, ProfilesApi.updateProfile);
router.delete('/:id', middlewares.checkForUser, ProfilesApi.deleteProfile);

router.get('/email/:email', middlewares.checkForUser, ProfilesApi.getProfileByEmail);
router.get('/phone/:phone', middlewares.checkForUser, ProfilesApi.getProfileByPhone);

router.get('/guests', middlewares.checkForUser, ProfilesApi.getGuestProfiles);
router.get('/full', middlewares.checkForUser, ProfilesApi.getFullProfiles);

// CURRENT LOGGED-IN USER
router.get('/me', middlewares.checkForUser, ProfilesApi.getCurrentProfile);
router.put('/me', middlewares.checkForUser, ProfilesApi.updateCurrentProfile);
router.delete('/me', middlewares.checkForUser, ProfilesApi.deleteCurrentProfile);

export default router
