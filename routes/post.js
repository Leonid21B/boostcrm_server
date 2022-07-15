import pkg from 'express'
import Controller from '../controllers/posts.js'
const controller = new Controller()
const { Router } = pkg
const router = Router()

router.post('/create_post',controller.createPost)
router.post('/create_item',controller.createItem)
router.post('/create_object',controller.createObjectText)
router.delete('/delete_post/:postId',controller.deletePost)
router.delete('/delete_item/:itemId',controller.deleteItem)
router.delete('/delete_object/:objectId',controller.deleteObject)
router.post('/move_item',controller.moveItem)
router.post('/move_object',controller.moveObject)
router.get('/get_post/:postId',controller.getPost)
router.get('/get_all_posts',controller.getAllPosts)
router.post('/change_post',controller.changePost)
router.post('/change_item',controller.changeItem)
router.post('/change_object',controller.changeObject)
router.post('/upload_file_value',controller.changeImgObject)
router.post('/delete_values',controller.deleteValues)
router.post('/upload_file_post',controller.changeObject)

export default router