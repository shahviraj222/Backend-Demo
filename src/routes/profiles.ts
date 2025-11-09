import { Router } from 'express'

import ProfilesApi from '../controllers/profilesController'

const router = Router()

router.get('/', ProfilesApi.getProfiles)
router.get('/:id', ProfilesApi.getProfile)
router.post('/', ProfilesApi.createProfile)
router.put('/:id', ProfilesApi.updateProfile)
router.delete('/:id', ProfilesApi.deleteProfile)
router.get('/email/:email', ProfilesApi.getProfileByEmail)
router.get('/phone/:phone', ProfilesApi.getProfileByPhone)
router.get('/guests', ProfilesApi.getGuestProfiles)
router.get('/full', ProfilesApi.getFullProfiles)
router.get('/me', ProfilesApi.getCurrentProfile)
router.put('/me', ProfilesApi.updateCurrentProfile)
router.delete('/me', ProfilesApi.deleteCurrentProfile)

export default router
