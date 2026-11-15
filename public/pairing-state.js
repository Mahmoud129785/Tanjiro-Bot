(function(root){
  const isConnected=data=>data?.connected===true;
  if(typeof module==='object'&&module.exports)module.exports={isConnected};
  else root.PairingState={isConnected};
})(typeof window==='undefined'?globalThis:window);