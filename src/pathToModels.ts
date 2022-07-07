export const pathToModels = ()=>{
if (document.location.href.includes("github"))
{
    return "models/"
}
else
{
return "../models/"

} 
}