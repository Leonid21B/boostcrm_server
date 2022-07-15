import PostsService from '../middleware/posts.js'

class PostsController {
  async createPost(req,res,next) {
    try{
      const post= await PostsService.createPost()
      return res.json(post)
    }catch(err){
      console.log(err)
      return res.json({})
    }
  }
  async createItem(req,res,next) {
    try{
      const item = await PostsService.createItem(req.body)
      const post = await PostsService.getPost({postId:item.post.id})
      if(!post){
        return res.json(false)
      }
      return res.json({post:post})
    }catch(err){
      console.log(err)
      return res.json({})
    }
  }
  async createObjectText(req,res,next) {
    try{
      const item = await PostsService.createObjectText(req.body)
      return res.json(item)
    }catch(err){
      console.log(err)
      return res.json({})
    }
  }
  async deletePost(req,res,next) {
    try{
      const result = await PostsService.deletePost(req.params)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async deleteItem(req,res,next) {
    try{
      const result = await PostsService.deleteItem(req.params)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async deleteObject(req,res,next) {
    try{
      const result = await PostsService.deleteObject(req.params)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async moveItem(req,res,next) {
    try{
      const result = await PostsService.moveItem(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async moveObject(req,res,next) {
    try{
      const result = await PostsService.moveObject(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async getPost(req,res,next) {
    try{
      const result = await PostsService.getPost(req.params)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async changePost(req,res,next) {
    try{
      const result = await PostsService.changePost(req.body,req.files?.file)
      console.log(result)
      const post = await PostsService.getPost({postId:result.id})
      return res.json(post)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async changeItem(req,res,next) {
    try{
      const result = await PostsService.changeItem(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async changeObject(req,res,next) {
    try{
      const result = await PostsService.changeObject(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async getAllPosts(req,res,next) {
    try{
      const result = await PostsService.getAllPosts(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async changeImgObject(req,res,next) {
    try{
      console.log(req.files)
      const result = await PostsService.uploadFileValue(req.body,req.files.file)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
  async deleteValues(req,res,){
    try{
      const result = await PostsService.deleteValues(req.body)
      return res.json(result)
    }catch(err){
      console.log(err)
      return res.json(false)
    }
  }
}

export default PostsController