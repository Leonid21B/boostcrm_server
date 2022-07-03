import { Item } from "../models/item.js"
import { Post } from "../models/post.js"
import {ObjectText} from '../models/objectText.js'

const postDto = (post) => {
  return{
    zag:post.zag,
    image: post.imgref,
    startedText:post.startedText,
    id: post.id,
    items:[],
  }
}
const itemDto = (item) => {
  return{
    zag:item.zag,
    startedText:item.startedText,
    id: item.id,
    postId:item.PostId,
    objects:[],
  }
}
const objectDto = (object) => {
  return{
    type:object.type,
    valuet:object.value,
    id: object.id,
    postId:object.PostId,
    itemId:object.itemId
  }
}
class PostsService{
  async createPost(){
    try{
      const post = await Post.create({zag:'Новый пост'})
      return post
    }catch(err){
      console.log(err)
      return false
      
    }
  }
  async createItem({postId,zag = 'Новый блок',position = null}){
    try{
      const post = await Post.findById(postId)
      if(!post){
        return false
      }
      let arrItems = [...post.items]
      const item = await Item.create({PostId:postId,zag:zag})
      if(!position){
        arrItems.push(item._id)
      }
      await Post.findByIdAndUpdate(postId,{items:arrItems})
      return item
    }catch(err){
      console.log(err)
      return false
    }
  }
  async createObjectText({itemId,type,content,position = null}){
    try{
      if(!Array.isArray(content)){
        return false
      }
      const item = await Item.findById(itemId)
      const post = await Post.findOne({_id: item.PostId})
      if(!item || !post){
        return false
      }
      const object = await ObjectText.create({PostId:post._id, itemId: item._id,type:type,value:[...content]})
      let arrItems = [...item.objects]
      if(!position){
        arrItems.push(object._id)
      }
      await Item.findByIdAndUpdate(itemId,{objects:arrItems})
      return object
    }catch(err){
      console.log(err)
      return false
    }
  }
  async deletePost({postId}){
    try{
      const post = await Post.findById(postId)
      if(!post.items && post){
        await Post.findByIdAndDelete(postId)
        return true
      }
      for (let it in post.items){
        const itm = await Item.findOne({_id:post.items[it]})
        console.log(post.items[it])
        for (let obj in itm.objects){
          await ObjectText.deleteMany({_id:itm.objects[obj]})
        }
        await Item.deleteMany({_id:post.items[it]})
      }

      await Post.findByIdAndDelete(postId)
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async deleteItem({itemId}){
    try{
      const item = await Item.findById(itemId)
      if(!item){
        return false
      }
      const post = await Post.findOne({_id:item.PostId})
      let newArr = [...post.items]
      for (let it in newArr){
        const prob = await Item.findOne({_id: newArr[it]})
        if(prob.id == item.id){
          newArr.splice(it,1)
        }
      }
      
      await Post.findOneAndUpdate({_id : post._id},{items:newArr})
      for (let it in item.objects){
        await ObjectText.findOneAndDelete({_id: item.objects[it]})
      }
      await Item.findByIdAndDelete(itemId)
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async deleteObject({objectId}){
    try{
      const object = await ObjectText.findById(objectId)
      const item = await Item.findOne({_id:object.itemId})
      
      let newArr = [...item.objects]
      for (let it in newArr){
        const prob = await ObjectText.findOne({_id: newArr[it]})
        if(prob.id == object.id){
          newArr.splice(it,1)
        }
      }
      await Item.findOneAndUpdate({_id : item._id},{objects:newArr})
      await ObjectText.findByIdAndDelete(objectId)
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async moveItem({itemId,position}){
    try{
      const item = await Item.findById(itemId)
      const post = await Post.findOne({_id:item.PostId})
      if(position >= post.items.length || position < 0){
        console.log('position_error')
        return false
      }
      let array = [...post.items]
      let leftArr = array.slice(0,position)
      let rightArr = array.slice(position,array.length)
      for(let it in leftArr){
        const itm = await Item.findOne({_id:leftArr[it]})
        if(itm.id == item.id){
          leftArr.splice(it,1)
        }
      }
      for(let it in rightArr){
        const itm = await Item.findOne({_id:rightArr[it]})
        if(itm.id == item.id){
          rightArr.splice(it,1)
        }
      }
      let newArr = []
      newArr = [...leftArr]
      newArr.push(item._id)
      newArr = [...newArr,rightArr]
      await Post.findOneAndUpdate({_id:post._id},{items:newArr})
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async moveObject({objectId,position}){
    try{
      const object = await ObjectText.findById(objectId)
      const item = await Item.findOne({_id:object.itemId})
      if(position >= item.objects.length || position < 0){
        console.log('position_error')
        return false
      }
      let array = [...item.objects]
      let leftArr = array.slice(0,position)
      let rightArr = array.slice(position,array.length)
      for(let it in leftArr){
        const obj = await ObjectText.findOne({_id:leftArr[it]})
        if(obj.id == object.id){
          leftArr.splice(it,1)
        }
      }
      for(let it in rightArr){
        const obj = await ObjectText.findOne({_id:rightArr[it]})
        if(obj.id == object.id){
          rightArr.splice(it,1)
        }
      }
      let newArr = []
      newArr = [...leftArr]
      newArr.push(object._id)
      newArr = [...newArr,rightArr]
      await Item.findOneAndUpdate({_id:item._id},{objects:newArr})
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async getPost({postId}){
    try{
      console.log(postId)
      const post = await Post.findById(postId)
      console.log(post)
      let resPost = postDto(post)
      for (let it of post.items){
        const item = await Item.findOne({_id:it})
        let resIt = itemDto(item)
        for (let obj of item.objects){
          const object = await ObjectText.findOne({_id:obj})
          let resObject = objectDto(object)
          resIt.objects.push(resObject)
        }
        resPost.items.push(resIt)
      }
      return {post:resPost}
    }catch(err){
      console.log(err)
      return false
    }
  }
  async changePost({postId,zag,startedText}){
    try{
      if(startedText){
        await Post.findByIdAndUpdate(postId,{startedText:startedText})
      }
      if(zag){
        await Post.findByIdAndUpdate(postId,{zag:zag})
      }
      const post = await Post.findById(postId)
      return {post: postDto(post)}
    }catch(err){
      console.log(err)
      return false
    }
  }
  async changeItem({itemId,zag}){
    try{
      if(zag){
        await Item.findByIdAndUpdate(itemId,{zag:zag})
      }
      const item = await Item.findById(itemId)
      return {item: itemDto(item)}
    }catch(err){
      console.log(err)
      return false
    }
  }
  async changeObject({objectId,value}){
    try{
      if(value){
        await ObjectText.findByIdAndUpdate(objectId,{value:value})
      }
      const object = await ObjectText.findById(objectId)
      return {object: objectDto(object)}
    }catch(err){
      console.log(err)
      return false
    }
  }
  async getAllPosts(){
    try{
      let arrPosts = []
      const posts = await Post.find()
      for(let post of posts){
        arrPosts.push(postDto(post))
      }
      return {posts: arrPosts}
    }catch(err){
      console.log(err)
      return false
    }
  }
}

export default new PostsService()