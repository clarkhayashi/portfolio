// Network requests may finish out of order. Never roll a room back to an older revision.
export function isCurrentState(current,next){
 return !current||current.code!==next.code||(next.version??0)>=(current.version??0);
}
