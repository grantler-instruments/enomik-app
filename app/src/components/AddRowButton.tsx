import { Add } from "@mui/icons-material";
import { IconButton } from "@mui/material";

const AddRowButton = ({visible = true, onClick}:{visible?: boolean, onClick: () => void}) => {

  return (
    <IconButton
          onClick={onClick}
          sx={{opacity: visible ? 1 : 0}}
        >
          <Add></Add>
        </IconButton>
  )
}

export default AddRowButton;