<?php
function login($username, $password) {
   $sql = 'SELECT username from  login where username = '.$username.' AND password = '.$password;
   $conn = mysqli_connect("localhost","my_user","my_password","my_db");
   if (mysqli_connect_errno())
   {
       echo "Error contact support";
   }
   
   $result = mysqli_query($conn,$sql);
   if (mysqli_num_rows ($result) = 1){
      return TRUE;
   }
   else {
      return FALSE;
   }
   mysqli_close($conn);
 }