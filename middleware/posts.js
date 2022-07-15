import { Item } from "../models/item.js"
import { Post } from "../models/post.js"
import {ObjectText} from '../models/objectText.js'
import fs from 'fs'
import { v1 } from "uuid"

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
    value:object.value,
    id: object.id,
    postId:object.PostId,
    itemId:object.itemId
  }
}
class PostsService{
  async createPost(){
    try{
      const post = await Post.create({zag:'Новый пост'})
      return {post:postDto(post)}
    }catch(err){
      console.log(err)
      return false
      
    }
  }
  async createItem({postId,zag = 'Новый блок',position = null}){
    try{
      let newZag = zag
      if(zag == null){
        newZag = 'Новый блок'
      }
      console.log(postId)
      const post = await Post.findById(postId)
      if(!post){
        return false
      }
      let arrItems = [...post.items]
      const item = await Item.create({PostId:postId,zag:newZag})
      if(!position){
        arrItems.push(item._id)
      }else{
        let leftArr = arrItems.slice(0,position + 1)
        let rightArr = arrItems.slice(position + 1)
        arrItems = [...leftArr, item._id]
        arrItems = [...arrItems,...rightArr]
      }
      await Post.findByIdAndUpdate(postId,{items:arrItems})
      const resPost = await Post.findById(postId)
      return {
        post:postDto(resPost)
      }
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
      let item = await Item.findById(itemId)
      const post = await Post.findOne({_id: item.PostId})
      if(!item || !post){
        return false
      }
      const object = await ObjectText.create({PostId:post._id, itemId: item._id,type:type,value:[...content]})
      let arrItems = [...item.objects]
      if(!position && position !== 0){
        arrItems.push(object._id)
      }else{
        let leftArr = arrItems.slice(0,position + 1)
        let rightArr = arrItems.slice(position + 1)
        arrItems = [...leftArr, object._id]
        arrItems = [...arrItems,...rightArr]
      }
      await Item.findByIdAndUpdate(itemId,{objects:arrItems})
      item = await Item.findById(itemId)
      let resItem = itemDto(item)
      for(let obj of item.objects){
        const object = await ObjectText.findOne({_id: obj})
        resItem.objects.push(objectDto(object))
      }
      return {item : resItem}
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
      console.log('delete ', itemId)
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
  async moveItem({postId,array}){
    try{
      let newArr = []
      for (let it of array){
        const item = await Item.findById(it)
        newArr.push(item._id)
      }
      await Post.findByIdAndUpdate(postId,{items:newArr})
      return true
    }catch(err){
      console.log(err)
      return false
    }
  }
  async moveObject({itemId,array}){
    try{
      let newArr = []
      for (let it of array){
        const obj = await ObjectText.findById(it)
        newArr.push(obj._id)
      }
      await Item.findByIdAndUpdate(itemId,{objects:newArr})
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
  async changePost({postId,zag,startedText,arrItems},file){
    try{
      console.log({postId,zag:zag,startedText:startedText,arrItems},file)
      if(file){
        const post = await Post.findById(postId)
        
        const name = `${v1()}.jpg`
        const fullPath = `${process.env.FILE_STATIC_PATH}/files/posts`
        
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath)
        }
        if(fs.existsSync(fullPath + '/' + post.imgref) && post.imgref){
          fs.unlinkSync(fullPath + '/' + post.imgref)
        }
        file.mv(`${fullPath}/${name}`)
        await Post.findByIdAndUpdate(postId,{imgref:name})
      }
      if(startedText && startedText != 'null'){
        await Post.findByIdAndUpdate(postId,{startedText:startedText})
      }
      if(zag && zag != 'null'){
        await Post.findByIdAndUpdate(postId,{zag:zag})
      }
      if(arrItems && arrItems != 'null'){
        let newArr = []
        let copyArr = JSON.parse(arrItems)
        for (let it of copyArr){
          const item = await Item.findById(it)
          newArr.push(item._id)
        }
        await Post.findByIdAndUpdate(postId,{items:newArr})
      }
      const post = await Post.findById(postId)
      return postDto(post)
    }catch(err){
      console.log(err)
      return false
    }
  }
  async changeItem({itemId,zag,arrObjects = []}){
    try{
      if(zag){
        await Item.findByIdAndUpdate(itemId,{zag:zag})
      }
      console.log(arrObjects)
      if(arrObjects != [] && arrObjects){
        let resArrObj = []
        for(let ob of arrObjects){
          const object = await ObjectText.findById(ob)
          resArrObj.push(object._id)
        }
        await Item.findByIdAndUpdate(itemId,{objects:resArrObj})
      }
      const item = await Item.findById(itemId)
      let resItem = itemDto(item)
      for (let obj in item.objects){
        const object = await ObjectText.findOne({_id:item.objects[obj]})
        resItem.objects.push(objectDto(object))
      }
      return {item: resItem}
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

  async uploadFileValue({objectId,value = ['new']},file){
    try{
      console.log(file)
      console.log(value)
      console.log(JSON.parse(value))
      console.log(objectId)
      const name = `${v1()}.jpg`
      const fullPath = `${process.env.FILE_STATIC_PATH}/files/values`
      if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath)
        }
      file.mv(`${fullPath}/${name}`)
      let resObject = [...JSON.parse(value)]
      for(let it in resObject){
        if(resObject[it] === 'new'){
          resObject[it] = '/' + name
        }
      }
      const object = await ObjectText.findByIdAndUpdate(objectId,{value:resObject},{new:true})
      return objectDto(object)
    }catch(err){
      console.log(err)
      return false
    }
  }
  async deleteValues({objectId,array}){
    try{
      console.log(objectId,array)
      const fullPath = `${process.env.FILE_STATIC_PATH}/values`
      let resArr = [...array]
      const object = await ObjectText.findById(objectId)
      let delArr = [] 
      let resultArr = []
      resArr.forEach((it,ind) => {
        if(it == 'deleted'){
          delArr.push(object.value[ind])
        }else{
          resultArr.push(it)
        }
      })
  
      const resObject = await ObjectText.findByIdAndUpdate(objectId,{value:resultArr},{new:true})
      for (let it of delArr){
        if( object.type === 'img' && fs.existsSync(it)){
          fs.unlinkSync(it)
        }
      }

      return {
        object: objectDto(resObject)
      }
    }catch(err){
      console.log(err)
      return false
    }
  }
}

export default new PostsService()